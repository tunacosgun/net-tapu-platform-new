import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { Browser } from 'puppeteer-core';
// puppeteer-extra wraps puppeteer-core; the stealth plugin patches every
// known fingerprint vector Cloudflare/Turnstile/Datadome inspect.
// Use addExtra() so the plugin attaches to puppeteer-core specifically
// (puppeteer-extra's default require('puppeteer') would crash since the
// monolith only has puppeteer-core installed).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { addExtra } = require('puppeteer-extra');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteerCore = require('puppeteer-core');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const puppeteerExtra = addExtra(puppeteerCore);
puppeteerExtra.use(StealthPlugin());

export interface ScrapedListing {
  source: 'sahibinden';
  sourceUrl: string;
  title: string | null;
  description: string | null;
  price: number | null;
  currency: string;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  ada: string | null;
  parsel: string | null;
  paftaNo: string | null;
  areaM2: number | null;
  zoningStatus: string | null;
  deedType: string | null;
  kaksEmsal: string | null;
  gabari: string | null;
  creditEligible: boolean | null;
  tradeAccepted: boolean | null;
  imageUrls: string[];
  raw: Record<string, string>;
}

/**
 * Best-effort scraper for sahibinden.com listing pages.
 *
 * Strategy: fetch the HTML with browser-like headers, parse the "classifiedInfo"
 * details table and image gallery via cheerio. Sahibinden's classified
 * pages embed the attributes in a stable <ul class="classifiedInfoList">
 * structure that survives most site redesigns.
 *
 * If the request gets blocked by Cloudflare/anti-bot we surface the failure
 * and let the admin fall back to manual entry.
 */
@Injectable()
export class SahibindenScraperService {
  private readonly logger = new Logger(SahibindenScraperService.name);

  /**
   * Launch a headless Chromium that's already on the host (apk add chromium
   * in the Dockerfile, see CHROMIUM_PATH env). Each scrape spawns its own
   * browser instance to keep the worker stateless and to make sure cookies
   * from one request don't leak into another.
   */
  private async launchBrowser(): Promise<Browser> {
    const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';
    return puppeteerExtra.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--lang=tr-TR',
      ],
    }) as Promise<Browser>;
  }

  async scrape(url: string): Promise<ScrapedListing> {
    if (!/^https?:\/\/(www\.)?sahibinden\.com\//i.test(url)) {
      throw new BadRequestException('Geçerli bir sahibinden.com bağlantısı girin.');
    }

    let html: string;

    // Prefer ScraperAPI when SCRAPERAPI_KEY is set — it runs the JS challenge
    // on residential IPs and returns the resolved HTML. Falls back to local
    // headless Chromium when the key is missing (works for sites without
    // Cloudflare; sahibinden currently always fails the local path).
    const scraperApiKey = process.env.SCRAPERAPI_KEY;
    if (scraperApiKey) {
      try {
        const apiUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}` +
          `&url=${encodeURIComponent(url)}&country_code=tr&render=true`;
        const res = await fetch(apiUrl, { signal: AbortSignal.timeout(60000) });
        if (!res.ok) {
          throw new Error(`ScraperAPI HTTP ${res.status}`);
        }
        html = await res.text();
        if (html && html.length > 500 && !/Bir dakika|Just a moment/i.test(html.slice(0, 2000))) {
          return this.parseHtml(html, url);
        }
        // Otherwise fall through to local Chromium attempt
        this.logger.warn('ScraperAPI returned a challenge page, retrying with local Chromium');
      } catch (err: any) {
        this.logger.warn(`ScraperAPI failed (${err?.message}), falling back to local Chromium`);
      }
    }

    let browser: Browser | null = null;
    try {
      browser = await this.launchBrowser();
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      );
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      });
      await page.setViewport({ width: 1280, height: 900 });

      // Note: navigator.webdriver / chrome.runtime / WebGL / permissions /
      // user-agent metadata fingerprints are all handled by the stealth
      // plugin via puppeteerExtra.use(StealthPlugin()) at module init.

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Cloudflare's JS challenge replaces the body, then redirects/reloads.
      // Poll up to 30 s for either: (a) the real listing markup (h1 +
      // classifiedInfo) to appear, or (b) the title to lose the challenge
      // string in any language sahibinden serves it in.
      const challengeRe = /Just a moment|Bir dakika|cf-browser-verification|cf-challenge|Checking your browser|Verifying you are human/i;
      const deadline = Date.now() + 30000;
      let pageReady = false;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));
        const state: any = await page.evaluate(`(function() {
          var t = document.title || '';
          var bodyText = (document.body && document.body.innerText || '').slice(0, 1000);
          var hasListing = !!document.querySelector('h1.classifiedDetailTitle, ul.classifiedInfoList, #classifiedDescription');
          return { title: t, bodyText: bodyText, hasListing: hasListing };
        })()`);
        if (state.hasListing) { pageReady = true; break; }
        if (!challengeRe.test(state.title + ' ' + state.bodyText) && state.title && state.title.length > 5) {
          // Page is past the challenge but listing markers not found —
          // probably a generic page, exit loop and let cheerio parse it.
          pageReady = true;
          break;
        }
      }
      if (!pageReady) {
        this.logger.warn(`Sahibinden scraper timed out waiting for Cloudflare challenge to clear: ${url}`);
      }

      html = await page.content();
    } catch (err: any) {
      this.logger.error(`Scrape failed for ${url}: ${err?.message}`);
      throw new BadRequestException('İlan sayfasına ulaşılamadı. Sahibinden bot koruması engellemiş olabilir; biraz sonra tekrar deneyin.');
    } finally {
      if (browser) {
        try { await browser.close(); } catch { /* ignore */ }
      }
    }

    return this.parseHtml(html, url);
  }

  /** Run cheerio parsing on a resolved HTML payload. Shared by both the
   *  ScraperAPI path and the local Chromium fallback. */
  private parseHtml(html: string, url: string): ScrapedListing {
    const $ = cheerio.load(html);

    // Title
    const title =
      $('h1.classifiedDetailTitle').first().text().trim()
      || $('meta[property="og:title"]').attr('content')?.trim()
      || $('title').text().trim().replace(/\s*-\s*sahibinden\.com\s*$/i, '')
      || null;

    // Price
    const priceText = $('div.classifiedInfo h3').first().text().trim()
      || $('.classified-price-wrapper').first().text().trim()
      || '';
    const price = this.parsePrice(priceText);

    // Description
    const description =
      $('#classifiedDescription').text().trim().replace(/\s+\n/g, '\n').slice(0, 5000) || null;

    // Breadcrumb → city / district / neighborhood
    const crumbs: string[] = [];
    $('div.classifiedBreadCrumb a, .classified-breadcrumb a, nav.bc a').each((_, el) => {
      const t = $(el).text().trim();
      if (t && !/sahibinden|emlak|arsa|satılık/i.test(t)) crumbs.push(t);
    });
    const [city, district, neighborhood] = crumbs;

    // Attribute table
    const raw: Record<string, string> = {};
    $('ul.classifiedInfoList li').each((_, el) => {
      const label = $(el).find('strong').first().text().trim();
      const value = $(el).find('span').last().text().trim();
      if (label && value) raw[label] = value;
    });

    const num = (s: string | null | undefined) => {
      if (!s) return null;
      const m = s.replace(/\./g, '').replace(/,/g, '.').match(/-?\d+(\.\d+)?/);
      return m ? Number(m[0]) : null;
    };

    const get = (...keys: string[]) => {
      for (const k of keys) {
        for (const key of Object.keys(raw)) {
          if (key.toLocaleLowerCase('tr').includes(k.toLocaleLowerCase('tr'))) return raw[key];
        }
      }
      return null;
    };

    const ada = get('ada no', 'ada');
    const parsel = get('parsel no', 'parsel');
    const paftaNo = get('pafta no', 'pafta');
    const areaM2 = num(get('m²', 'metrekare', 'alan')) ;
    const zoningStatus = get('imar durumu', 'imar');
    const deedType = get('tapu durumu', 'tapu');
    const kaksEmsal = get('kaks', 'emsal');
    const gabari = get('gabari');
    const krediText = get('krediye uygun');
    const creditEligible = krediText ? /evet|uygun/i.test(krediText) : null;
    const takasText = get('takas');
    const tradeAccepted = takasText ? /evet/i.test(takasText) : null;

    // Images
    const imageUrls: string[] = [];
    $('ul.classifiedDetailMainPhoto img, .ovs-image img, .classified-gallery img, img[data-src]').each((_, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src');
      if (src && /^https?:\/\//.test(src) && !imageUrls.includes(src) && !/sprite|logo|svg/i.test(src)) {
        // Sahibinden serves smaller previews — upgrade size token if present
        const big = src.replace(/\/x\d+\//i, '/x800/');
        imageUrls.push(big);
      }
    });

    return {
      source: 'sahibinden',
      sourceUrl: url,
      title,
      description,
      price,
      currency: 'TRY',
      city: city || null,
      district: district || null,
      neighborhood: neighborhood || null,
      ada,
      parsel,
      paftaNo,
      areaM2,
      zoningStatus,
      deedType,
      kaksEmsal,
      gabari,
      creditEligible,
      tradeAccepted,
      imageUrls: imageUrls.slice(0, 30),
      raw,
    };
  }

  private parsePrice(text: string): number | null {
    if (!text) return null;
    // "1.234.567 TL" or "1.234.567,89 TL" → 1234567 / 1234567.89
    const m = text.replace(/[^\d.,]/g, '').match(/[\d.,]+/);
    if (!m) return null;
    const norm = m[0].replace(/\./g, '').replace(',', '.');
    const n = Number(norm);
    return isFinite(n) ? n : null;
  }
}
