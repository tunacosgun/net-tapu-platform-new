# NetTapu Platform - Prodüksiyon Altyapi ve Satin Alma Rehberi

> **Belge Versiyonu:** 1.0
> **Tarih:** Mart 2026
> **Hedef Kitle:** Proje yoneticileri, sistem yoneticileri ve teknik karar vericiler

---

## Icindekiler

1. [Domain ve DNS](#1-domain-ve-dns)
2. [VPS / Sunucu](#2-vps--sunucu)
3. [Sunucu Kurulumu](#3-sunucu-kurulumu)
4. [Veritabani (PostgreSQL + PostGIS)](#4-veritabani-postgresql--postgis)
5. [Redis](#5-redis)
6. [Odeme Sistemleri (PayTR + iyzico)](#6-odeme-sistemleri-paytr--iyzico)
7. [E-posta Servisi (SendGrid)](#7-e-posta-servisi-sendgrid)
8. [SMS Servisi (NetGSM)](#8-sms-servisi-netgsm)
9. [Dosya Depolama](#9-dosya-depolama)
10. [CDN (Cloudflare)](#10-cdn-cloudflare)
11. [Deployment (Yayin Alma)](#11-deployment-yayin-alma)
12. [Mobil Uygulama Hesaplari](#12-mobil-uygulama-hesaplari)
13. [Maliyet Tahmini](#13-maliyet-tahmini)
14. [Son Kontrol Listesi](#14-son-kontrol-listesi)

---

## 1. Domain ve DNS

### 1.1 Domain Nereden Alinir?

| Saglayici | Fiyat (.com) | Link |
|-----------|-------------|------|
| Namecheap | ~$9-12/yil | https://www.namecheap.com/domains/ |
| GoDaddy | ~$12-18/yil | https://www.godaddy.com/tr-tr/domain |
| Natro (Turk) | ~99-149 TL/yil | https://www.natro.com/domain |
| isimtescil.net | ~89-129 TL/yil | https://www.isimtescil.net/ |
| Turhost | ~99-139 TL/yil | https://www.turhost.com/domain-sorgulama |

**Tavsiye:** Namecheap veya isimtescil.net. Namecheap uluslararasi alanda en guvenilir secenektir. Turk saglaycisi tercih ediliyorsa isimtescil.net uygun fiyatlidir.

### 1.2 DNS Kayitlari

Domain alindiktan sonra asagidaki DNS kayitlarini olusturun. Sunucu IP adresinizi `SUNUCU_IP` yerine yazin.

| Kayit Tipi | Ad | Deger | TTL |
|------------|-----|-------|-----|
| A | `nettapu.com` | SUNUCU_IP | 300 |
| A | `www` | SUNUCU_IP | 300 |
| A | `api` | SUNUCU_IP | 300 |
| A | `app` | SUNUCU_IP | 300 |
| A | `admin` | SUNUCU_IP | 300 |
| CNAME | `www` | `nettapu.com` | 3600 |
| MX | `@` | SendGrid degerlerine gore | 3600 |
| TXT | `@` | SPF kaydi (asagida detaylandirildi) | 3600 |

> **Not:** Cloudflare CDN kullanacaksaniz, DNS kayitlarini Cloudflare uzerinden yonetin. Boylece proxy (turuncu bulut) otomatik aktif olur.

### 1.3 Alt Domainler

NetTapu platformu icin su alt domainler gereklidir:

- `nettapu.com` — Ana web sitesi (Next.js)
- `api.nettapu.com` — Backend API (NestJS monolith)
- `app.nettapu.com` — Kullanici uygulamasi (istegli; Next.js ile ayni olabilir)
- `admin.nettapu.com` — Yonetim paneli
- `ws.nettapu.com` — WebSocket baglantilari (istegli; api uzerinden de yonetilebilir)

---

## 2. VPS / Sunucu

### 2.1 Neden Hetzner?

Hetzner, Avrupa merkezli bir saglayicidir ve Turkiye'ye yakin sunucu lokasyonlari (Helsinki, Falkenstein, Nurnberg) sunar. Fiyat/performans orani sektorun en iyisidir.

### 2.2 Sunucu Gereksinimleri

#### Minimum Ozellikler (Baslangic)

| Ozellik | Deger | Aciklama |
|---------|-------|----------|
| vCPU | 4 cekirdek | PostgreSQL + NestJS + Next.js icin yeterli |
| RAM | 8 GB | Redis, PostGIS sorgulari ve WebSocket baglantilari icin |
| Disk | 160 GB NVMe SSD | Veritabani, gorsel dosyalar ve loglar |
| Bant genisligi | 20 TB/ay | Yuksek trafikli harita verileri ve gorsel yuklemeleri |
| Isletim sistemi | Ubuntu 22.04 LTS | Uzun sureli destek, genis topluluk |

#### Tavsiye Edilen Ozellikler (Uretim)

| Ozellik | Deger | Aciklama |
|---------|-------|----------|
| vCPU | 8 cekirdek | Canli muzayede sirasinda yogun islem yukleri |
| RAM | 16 GB | Esanli Socket.IO baglantilari ve gorsel isleme |
| Disk | 240 GB NVMe SSD | Veritabani buyumesi ve yedekleme alani |
| Bant genisligi | 20 TB/ay | Standart |
| Isletim sistemi | Ubuntu 22.04 LTS | Standart |

#### Neden Bu Ozellikler?

- **PostgreSQL + PostGIS:** Cografi sorgular (ST_DWithin, ST_Intersects) yuksek bellek tuketir
- **Redis:** Oturum yonetimi, onbellek ve muzayede sira kilitleri icin RAM gerektirir
- **WebSocket (Socket.IO):** Canli muzayedede binlerce esanli baglanti
- **Gorsel isleme:** Parsel fotograf boyutlandirma ve thumbnail olusturma CPU yogundur
- **Docker:** Her konteyner ek bellek tuketir

### 2.3 Saglayici Karsilastirmasi

| Saglayici | Plan | vCPU | RAM | Disk | Fiyat | Link |
|-----------|------|------|-----|------|-------|------|
| **Hetzner** | CPX31 | 4 | 8 GB | 160 GB | **€15.90/ay (~$17)** | https://www.hetzner.com/cloud/ |
| **Hetzner** | CPX41 | 8 | 16 GB | 240 GB | **€30.90/ay (~$34)** | https://www.hetzner.com/cloud/ |
| DigitalOcean | Premium 8GB | 4 | 8 GB | 160 GB | $48/ay | https://www.digitalocean.com/pricing/droplets |
| DigitalOcean | Premium 16GB | 8 | 16 GB | 320 GB | $96/ay | https://www.digitalocean.com/pricing/droplets |
| Vultr | Cloud Compute | 4 | 8 GB | 160 GB | $48/ay | https://www.vultr.com/pricing/ |

> **Sonuc:** Hetzner, ayni ozellikler icin DigitalOcean'dan **3 kat daha ucuz**. Turkiye'ye yakinligi sayesinde gecikme suresi (latency) de dusuktur.

### 2.4 Siparis Adimlari (Hetzner)

1. https://www.hetzner.com/cloud/ adresine gidin
2. Hesap olusturun (e-posta + kimlik dogrulama gerekebilir)
3. Yeni proje olusturun: "NetTapu Production"
4. "Add Server" tiklayin
5. Lokasyon: **Helsinki** veya **Falkenstein** (Turkiye'ye en yakin)
6. Isletim sistemi: **Ubuntu 22.04**
7. Plan: **CPX41** (tavsiye edilen) veya **CPX31** (baslangic)
8. SSH anahtarinizi ekleyin (asagida anlatildi)
9. Sunucu adi: `nettapu-prod-01`
10. "Create & Buy Now"

---

## 3. Sunucu Kurulumu

### 3.1 SSH Baglantisi

Ilk olarak yerel bilgisayarinizda SSH anahtari olusturun (yoksa):

```bash
ssh-keygen -t ed25519 -C "nettapu-prod"
```

Sunucuya baglanin:

```bash
ssh root@SUNUCU_IP
```

### 3.2 Sistem Guncelleme

```bash
apt update && apt upgrade -y
```

### 3.3 Yeni Kullanici Olusturma (root Kullanmayin)

```bash
adduser deploy
usermod -aG sudo deploy

# SSH anahtarini kopyala
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 3.4 SSH Guvenligi

```bash
nano /etc/ssh/sshd_config
```

Asagidaki satirlari degistirin:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222
```

Servisi yeniden baslatin:

```bash
systemctl restart sshd
```

> **Onemli:** Bu degisiklikten sonra `ssh deploy@SUNUCU_IP -p 2222` ile baglanin.

### 3.5 Guvenlik Duvari (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw enable
ufw status
```

### 3.6 Fail2Ban (Brute-Force Korumasi)

```bash
apt install fail2ban -y

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
EOF

systemctl enable fail2ban
systemctl start fail2ban
```

### 3.7 Docker Kurulumu

```bash
# Eski versiyonlari kaldir
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null

# Bagimliliklari kur
apt install -y ca-certificates curl gnupg lsb-release

# Docker GPG anahtari
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Docker deposunu ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker'i kur
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# deploy kullanicisina Docker yetkisi ver
usermod -aG docker deploy

# Test
docker --version
docker compose version
```

### 3.8 Nginx Kurulumu

```bash
apt install -y nginx
systemctl enable nginx
```

### 3.9 SSL Sertifikasi (Let's Encrypt)

```bash
# Certbot kur
apt install -y certbot python3-certbot-nginx

# Sertifika al (tum subdomain'ler icin)
certbot --nginx \
  -d nettapu.com \
  -d www.nettapu.com \
  -d api.nettapu.com \
  -d app.nettapu.com \
  -d admin.nettapu.com \
  --email admin@nettapu.com \
  --agree-tos \
  --non-interactive

# Otomatik yenileme testi
certbot renew --dry-run
```

Certbot otomatik olarak bir cron gorevi olusturur. Sertifikalar 90 gunluktur ve otomatik yenilenir.

### 3.10 Nginx Yapilandirmasi

```bash
cat > /etc/nginx/sites-available/nettapu << 'NGINX_EOF'
# HTTP -> HTTPS yonlendirme
server {
    listen 80;
    server_name nettapu.com www.nettapu.com api.nettapu.com app.nettapu.com admin.nettapu.com;
    return 301 https://$host$request_uri;
}

# Ana web sitesi (Next.js)
server {
    listen 443 ssl http2;
    server_name nettapu.com www.nettapu.com app.nettapu.com;

    ssl_certificate /etc/letsencrypt/live/nettapu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nettapu.com/privkey.pem;

    # Guvenlik basliklari
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Dosya yukleme limiti
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API (NestJS Monolith)
server {
    listen 443 ssl http2;
    server_name api.nettapu.com;

    ssl_certificate /etc/letsencrypt/live/nettapu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nettapu.com/privkey.pem;

    client_max_body_size 50M;

    # WebSocket icin
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Auction service WebSocket
    location /auction-ws/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin paneli
server {
    listen 443 ssl http2;
    server_name admin.nettapu.com;

    ssl_certificate /etc/letsencrypt/live/nettapu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nettapu.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/nettapu /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Yapilandirmayi test et
nginx -t

# Yeniden baslat
systemctl restart nginx
```

### 3.11 Swap Alani (Kucuk Sunucular Icin)

8 GB RAM'li sunucularda swap alani ekleyin:

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 4. Veritabani (PostgreSQL + PostGIS)

### 4.1 Docker ile Kurulum

PostgreSQL, Docker Compose icerisinde calisacaktir. Asagidaki yapilandirma `docker-compose.yml` dosyasinda yer alir (Bolum 11'de tam hali verilmistir).

```yaml
postgres:
  image: postgis/postgis:16-3.4-alpine
  container_name: nettapu-postgres
  restart: unless-stopped
  environment:
    POSTGRES_USER: nettapu_admin
    POSTGRES_PASSWORD: "${DB_PASSWORD}"
    POSTGRES_DB: nettapu_production
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./backups:/backups
  ports:
    - "127.0.0.1:5432:5432"
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U nettapu_admin -d nettapu_production"]
    interval: 10s
    timeout: 5s
    retries: 5
```

> **Onemli:** Port `127.0.0.1:5432:5432` olarak ayarlanmistir. Bu, veritabanina yalnizca sunucu icerisinden erisilmesini saglar.

### 4.2 Veritabani ve Kullanici Olusturma

Konteyner basladiktan sonra:

```bash
docker exec -it nettapu-postgres psql -U nettapu_admin -d nettapu_production
```

```sql
-- PostGIS eklentisini etkinlestir
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schema'lari olustur
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS listings;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS auctions;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS integrations;
CREATE SCHEMA IF NOT EXISTS campaigns;

-- Salt okunur kullanici (raporlama icin)
CREATE USER nettapu_readonly WITH PASSWORD 'GUCLU_BIR_SIFRE';
GRANT CONNECT ON DATABASE nettapu_production TO nettapu_readonly;
GRANT USAGE ON SCHEMA auth, listings, payments, admin, auctions, crm TO nettapu_readonly;
-- Her schema icin:
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO nettapu_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA listings TO nettapu_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA payments TO nettapu_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA admin TO nettapu_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA auctions TO nettapu_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA crm TO nettapu_readonly;
```

### 4.3 Yedekleme Stratejisi

#### Gunluk Otomatik Yedekleme

```bash
mkdir -p /opt/nettapu/backups

cat > /opt/nettapu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/nettapu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="nettapu_production_${DATE}.sql.gz"

# Yedek al
docker exec nettapu-postgres pg_dump \
  -U nettapu_admin \
  -d nettapu_production \
  --format=custom \
  --compress=9 \
  > "${BACKUP_DIR}/${FILENAME}"

# 30 gunden eski yedekleri sil
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

# Boyut bilgisi
ls -lh "${BACKUP_DIR}/${FILENAME}"
echo "Yedekleme tamamlandi: ${FILENAME}"
EOF

chmod +x /opt/nettapu/backup.sh
```

#### Cron ile Zamanlama

```bash
crontab -e
```

Asagidaki satiri ekleyin (her gun saat 03:00'te):

```
0 3 * * * /opt/nettapu/backup.sh >> /var/log/nettapu-backup.log 2>&1
```

#### Uzak Yedekleme (Tavsiye)

Yedekleri sunucu disina da kopyalayin:

```bash
# rsync ile baska sunucuya
rsync -avz /opt/nettapu/backups/ backup-user@yedek-sunucu:/backups/nettapu/

# veya Cloudflare R2 / AWS S3'e
# (rclone veya aws-cli ile)
```

---

## 5. Redis

### 5.1 Docker ile Kurulum

```yaml
redis:
  image: redis:7-alpine
  container_name: nettapu-redis
  restart: unless-stopped
  command: >
    redis-server
    --requirepass "${REDIS_PASSWORD}"
    --appendonly yes
    --appendfsync everysec
    --save 900 1
    --save 300 10
    --save 60 10000
    --maxmemory 1gb
    --maxmemory-policy allkeys-lru
  volumes:
    - redis_data:/data
  ports:
    - "127.0.0.1:6379:6379"
  healthcheck:
    test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### 5.2 Yapilandirma Aciklamalari

| Parametre | Deger | Aciklama |
|-----------|-------|----------|
| `requirepass` | Sifre | Yetkisiz erisimi engeller |
| `appendonly yes` | AOF aktif | Her yazma islemi diske kaydedilir |
| `appendfsync everysec` | Her saniye | Performans ve dayaniklilik dengesi |
| `save 900 1` | RDB | 900 saniyede 1 degisiklik varsa snapshot |
| `maxmemory 1gb` | Limit | Bellek tasmasini onler |
| `maxmemory-policy allkeys-lru` | LRU | Bellek dolunca en az kullanilan anahtar silinir |

### 5.3 Baglanti Testi

```bash
docker exec -it nettapu-redis redis-cli -a REDIS_SIFRESI
> PING
PONG
> INFO memory
```

---

## 6. Odeme Sistemleri (PayTR + iyzico)

### 6.1 PayTR

**Web sitesi:** https://www.paytr.com/

#### Kayit Icin Gereken Belgeler

1. Sirket vergi levhasi
2. Imza sirkuleri
3. Ticaret sicil gazetesi
4. Faaliyet belgesi
5. Sirket yetkili kimlik fotokopisi
6. IBAN bilgisi (sirket hesabi)

#### Kayit Adimlari

1. https://www.paytr.com/magaza/basvuru adresine gidin
2. "Bireysel" veya "Kurumsal" secin (kurumsal tavsiye edilir)
3. Belgeleri yukleyin
4. Onay sureci: 1-3 is gunu
5. Onaylandiktan sonra "Magaza Paneli"ne erisin
6. **API Bilgileri** sekmesinden su bilgileri alin:
   - `merchant_id` (Magaza numarasi)
   - `merchant_key` (Magaza anahtari)
   - `merchant_salt` (Magaza tuzu)

#### Sandbox (Test Ortami)

PayTR sandbox icin ayri bir basvuru gerekmez. Panelden "Test Modu" aktif edilir.

```
# .env dosyasinda
PAYTR_MERCHANT_ID=123456
PAYTR_MERCHANT_KEY=xxxxxxxxxxxxxxxx
PAYTR_MERCHANT_SALT=xxxxxxxxxxxxxxxx
PAYTR_BASE_URL=https://www.paytr.com
PAYTR_TEST_MODE=true   # Canli icin false
```

#### Komisyon Oranlari (2026 Tahmini)

- Banka karti: %1.79 + 0.35 TL
- Kredi karti (tek cekim): %2.49 + 0.35 TL
- Taksitli: %2.89 - %4.49

### 6.2 iyzico

**Web sitesi:** https://www.iyzico.com/

#### Kayit Icin Gereken Belgeler

PayTR ile benzer belgeler:
1. Vergi levhasi
2. Imza sirkuleri
3. Faaliyet belgesi
4. Yetkili kimlik fotokopisi

#### Kayit Adimlari

1. https://www.iyzico.com/hesap-olustur adresine gidin
2. Kurumsal hesap olusturun
3. Belgeleri yukleyin
4. Onay sureci: 2-5 is gunu
5. "Ayarlar > API Anahtarlari" sekmesinden:
   - `api_key`
   - `secret_key`

#### Sandbox

iyzico'nun ayri sandbox ortami vardir:

```
# .env dosyasinda
IYZICO_API_KEY=sandbox-xxxxxxxxx
IYZICO_SECRET_KEY=sandbox-xxxxxxxxx
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com  # Canli: https://api.iyzipay.com
```

Sandbox kayit: https://sandbox-merchant.iyzipay.com/

#### Komisyon Oranlari (2026 Tahmini)

- Banka karti: %1.59 + KDV
- Kredi karti: %2.49 + KDV
- Taksitli: sektore gore degisir

### 6.3 Hangi Sistemi Kullanmali?

NetTapu her ikisini de destekler (PosGatewayFactory ile). Tavsiye:

- **Ana sistem:** PayTR (daha yaygin, kolay entegrasyon)
- **Yedek sistem:** iyzico (PayTR ariza durumunda otomatik gecis)

```
# .env
POS_PROVIDER=paytr   # veya: iyzico, mock
```

---

## 7. E-posta Servisi (SendGrid)

### 7.1 Hesap Olusturma

1. https://signup.sendgrid.com/ adresine gidin
2. Hesap olusturun
3. E-posta dogrulamasi yapin

### 7.2 Planlar

| Plan | Fiyat | Limit |
|------|-------|-------|
| Free | $0/ay | 100 e-posta/gun |
| Essentials | $19.95/ay | 50.000 e-posta/ay |
| Pro | $89.95/ay | 100.000 e-posta/ay |

> **Baslangic icin:** Free plan yeterlidir (gunluk 100 e-posta). Kullanici sayisi arttikca Essentials'a gecin.

### 7.3 API Anahtari Olusturma

1. SendGrid panelinde: **Settings > API Keys**
2. "Create API Key" tiklayin
3. Ad: `nettapu-production`
4. Yetki: "Restricted Access" secin, yalnizca "Mail Send" izni verin
5. Anahtari kopyalayin (bir kez gosterilir!)

```
# .env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=bildirim@nettapu.com
SENDGRID_FROM_NAME=NetTapu
```

### 7.4 Domain Dogrulama (Cok Onemli!)

E-postalarin spam'e dusmemesi icin domain dogrulamasi sart:

1. SendGrid paneli: **Settings > Sender Authentication**
2. "Authenticate Your Domain" tiklayin
3. DNS saglayicinizi secin
4. SendGrid size 3 DNS kaydi verecektir:

#### SPF Kaydi
```
Tip: TXT
Ad: @
Deger: v=spf1 include:sendgrid.net ~all
```

#### DKIM Kayitlari
SendGrid'in verdigi 2 adet CNAME kaydi ekleyin.

#### DMARC Kaydi
```
Tip: TXT
Ad: _dmarc
Deger: v=DMARC1; p=quarantine; rua=mailto:dmarc@nettapu.com
```

5. DNS kayitlarini ekledikten sonra SendGrid'de "Verify" tiklayin
6. Dogrulama 24-48 saat surebilir

---

## 8. SMS Servisi (NetGSM)

### 8.1 Hesap Olusturma

**Web sitesi:** https://www.netgsm.com.tr/

1. https://www.netgsm.com.tr/uyelik adresine gidin
2. Kurumsal uyelik olusturun
3. Gereken bilgiler:
   - Sirket unvani
   - Vergi numarasi
   - Yetkili kisi bilgileri
   - Fatura adresi

### 8.2 Baslik (Sender ID) Kaydi

Turkiye'de SMS gondermek icin BTK onayli baslik (sender ID) gereklidir:

1. NetGSM paneli: **Ayarlar > Baslik Islemleri**
2. "Yeni Baslik Ekle" tiklayin
3. Baslik adi: `NETTAPU` (max 11 karakter)
4. Gerekli belgeler:
   - Baslik taahhutnamesi (NetGSM'den indirilir)
   - Sirket imza sirkuleri
5. Onay sureci: 3-7 is gunu (BTK onayi gerektirir)

### 8.3 API Yapilandirmasi

```
# .env
NETGSM_USERCODE=850XXXXXXX
NETGSM_PASSWORD=xxxxxxxx
NETGSM_HEADER=NETTAPU
NETGSM_API_URL=https://api.netgsm.com.tr
```

### 8.4 SMS Maliyeti

| Paket | Adet | Birim Fiyat | Toplam |
|-------|------|-------------|--------|
| Baslangic | 1.000 SMS | ~0.30 TL | ~300 TL |
| Orta | 5.000 SMS | ~0.22 TL | ~1.100 TL |
| Buyuk | 10.000 SMS | ~0.18 TL | ~1.800 TL |

> Fiyatlar KDV harictir ve donem donem degisir. Guncel fiyat icin NetGSM ile iletisime gecin.

---

## 9. Dosya Depolama

### 9.1 Cloudflare R2 (Tavsiye Edilen)

Cloudflare R2, Amazon S3 uyumlu bir nesne depolama servisidir. En buyuk avantaji: **cikis bant genisligi (egress) ucretsizdir.**

**Web sitesi:** https://www.cloudflare.com/products/r2/

#### Fiyatlandirma

| Ozellik | Fiyat |
|---------|-------|
| Depolama | $0.015/GB/ay |
| Class A islemleri (yazma) | $4.50/milyon islem |
| Class B islemleri (okuma) | $0.36/milyon islem |
| Cikis bant genisligi | **Ucretsiz** |

Ornek: 50 GB gorsel depolama = aylik ~$0.75

#### Kurulum Adimlari

1. https://dash.cloudflare.com/ adresine gidin
2. Sol menude **R2 Object Storage** tiklayin
3. "Create bucket" tiklayin
4. Bucket adi: `nettapu-media`
5. Lokasyon: "Europe" secin
6. **R2 API Tokens** olusturun:
   - "Manage R2 API Tokens" > "Create API Token"
   - Yetki: "Object Read & Write"
   - Bucket: `nettapu-media`

```
# .env
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=nettapu-media
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://media.nettapu.com
```

#### Genel Erisim Icin Custom Domain

1. R2 bucket ayarlari > "Public access" > "Custom domain"
2. `media.nettapu.com` ekleyin
3. Cloudflare DNS otomatik yapilandirilir

### 9.2 Alternatif: Yerel Depolama

Butce kisitliysa gorsellar sunucuda depolanabilir:

```bash
mkdir -p /opt/nettapu/uploads
chown deploy:deploy /opt/nettapu/uploads
```

Docker volume olarak baglayin:

```yaml
volumes:
  - /opt/nettapu/uploads:/app/uploads
```

> **Uyari:** Yerel depolamada sunucu arizi durumunda veriler kaybolabilir. Duzenly uzak yedekleme yapin.

---

## 10. CDN (Cloudflare)

### 10.1 Neden Cloudflare?

- Ucretsiz plan yeterli
- DDoS korumasi dahil
- Global CDN agiyla hizli icerik dagitimi
- SSL yonetimi
- DNS yonetimi

### 10.2 Kurulum

1. https://dash.cloudflare.com/sign-up adresine gidin
2. Hesap olusturun
3. "Add a site" tiklayin
4. `nettapu.com` girin
5. **Free** plani secin
6. Cloudflare size 2 nameserver adresi verecektir
7. Domain saglayicinizda (Namecheap vb.) nameserver'lari Cloudflare'e degistirin

### 10.3 DNS Yapilandirmasi

Cloudflare DNS panelinde:

| Tip | Ad | Icerik | Proxy |
|-----|-----|--------|-------|
| A | `@` | SUNUCU_IP | Turuncu bulut (Proxy ACIK) |
| A | `www` | SUNUCU_IP | Turuncu bulut |
| A | `api` | SUNUCU_IP | Turuncu bulut |
| A | `app` | SUNUCU_IP | Turuncu bulut |
| A | `admin` | SUNUCU_IP | Turuncu bulut |

### 10.4 SSL Modu

**SSL/TLS > Overview** sayfasinda:

- Mod: **Full (Strict)** secin

Bu mod, Cloudflare ile sunucunuz arasinda da sifreleme yapilmasini saglar (Let's Encrypt sertifikasi gerektirir).

### 10.5 Tavsiye Edilen Ayarlar

**Speed > Optimization:**
- Auto Minify: JavaScript, CSS, HTML (hepsini acin)
- Brotli: Acik

**Caching > Configuration:**
- Browser Cache TTL: 4 saat

**Security > Settings:**
- Security Level: Medium
- Challenge Passage: 30 dakika
- Browser Integrity Check: Acik

**Network:**
- WebSockets: Acik (Socket.IO icin gerekli!)

---

## 11. Deployment (Yayin Alma)

### 11.1 Proje Dizin Yapisi

```bash
mkdir -p /opt/nettapu
cd /opt/nettapu
git clone <REPO_URL> platform
cd platform
```

### 11.2 Ortam Degiskenleri (.env)

Asagidaki tum degiskenleri `/opt/nettapu/platform/.env` dosyasina yazin:

```bash
# ============================================
# GENEL
# ============================================
NODE_ENV=production
TZ=Europe/Istanbul

# ============================================
# VERITABANI
# ============================================
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=nettapu_admin
DB_PASSWORD=COK_GUCLU_BIR_SIFRE_BURAYA
DB_DATABASE=nettapu_production
DB_SYNCHRONIZE=false
DB_LOGGING=false

# ============================================
# REDIS
# ============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=COK_GUCLU_REDIS_SIFRESI

# ============================================
# JWT / AUTH
# ============================================
JWT_SECRET=EN_AZ_64_KARAKTER_RASTGELE_STRING
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=BASKA_BIR_RASTGELE_STRING
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# ODEME
# ============================================
POS_PROVIDER=paytr

# PayTR
PAYTR_MERCHANT_ID=123456
PAYTR_MERCHANT_KEY=xxxxxxxxxxxx
PAYTR_MERCHANT_SALT=xxxxxxxxxxxx
PAYTR_BASE_URL=https://www.paytr.com
PAYTR_TEST_MODE=false

# iyzico
IYZICO_API_KEY=xxxxxxxxxxxx
IYZICO_SECRET_KEY=xxxxxxxxxxxx
IYZICO_BASE_URL=https://api.iyzipay.com

# ============================================
# E-POSTA (SendGrid)
# ============================================
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_FROM_EMAIL=bildirim@nettapu.com
SENDGRID_FROM_NAME=NetTapu

# ============================================
# SMS (NetGSM)
# ============================================
NETGSM_USERCODE=850XXXXXXX
NETGSM_PASSWORD=xxxxxxxxxxxx
NETGSM_HEADER=NETTAPU

# ============================================
# BILDIRIM SISTEMI
# ============================================
NOTIFICATION_POLL_INTERVAL_MS=5000
NOTIFICATION_BATCH_SIZE=10

# ============================================
# DOSYA DEPOLAMA (R2)
# ============================================
R2_ACCOUNT_ID=xxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxx
R2_BUCKET_NAME=nettapu-media
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com

# ============================================
# UYGULAMA URL'LERI
# ============================================
APP_URL=https://nettapu.com
API_URL=https://api.nettapu.com
ADMIN_URL=https://admin.nettapu.com

# ============================================
# CORS
# ============================================
CORS_ORIGINS=https://nettapu.com,https://www.nettapu.com,https://admin.nettapu.com,https://app.nettapu.com
```

> **Onemli:** `.env` dosyasini asla Git'e eklemeyin! `.gitignore` dosyasinda `.env` satiri oldugundan emin olun.

#### Guclu Sifre Olusturma

```bash
# Rastgele sifre olustur
openssl rand -base64 32

# JWT secret icin
openssl rand -hex 64
```

### 11.3 Docker Compose (Uretim)

`docker-compose.prod.yml` dosyasi:

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.4-alpine
    container_name: nettapu-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_DATABASE}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - /opt/nettapu/backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME} -d ${DB_DATABASE}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 4G

  redis:
    image: redis:7-alpine
    container_name: nettapu-redis
    restart: unless-stopped
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --appendonly yes
      --appendfsync everysec
      --maxmemory 1gb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  monolith:
    build:
      context: .
      dockerfile: apps/monolith/Dockerfile
    container_name: nettapu-monolith
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  auction-service:
    build:
      context: .
      dockerfile: apps/auction-service/Dockerfile
    container_name: nettapu-auction
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:3003:3003"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: nettapu-web
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=${API_URL}
      - NODE_ENV=production
    ports:
      - "127.0.0.1:3002:3002"
    depends_on:
      monolith:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
```

### 11.4 Servisleri Baslatma

```bash
cd /opt/nettapu/platform

# Imajlari olustur
docker compose -f docker-compose.prod.yml build

# Servisleri baslat
docker compose -f docker-compose.prod.yml up -d

# Durumlari kontrol et
docker compose -f docker-compose.prod.yml ps

# Loglari izle
docker compose -f docker-compose.prod.yml logs -f

# Migration'lari calistir
docker exec nettapu-monolith npm run migration:run
```

### 11.5 Saglik Kontrolleri

```bash
# Tum servisleri kontrol et
docker compose -f docker-compose.prod.yml ps

# API saglik kontrolu
curl https://api.nettapu.com/health

# PostgreSQL
docker exec nettapu-postgres pg_isready

# Redis
docker exec nettapu-redis redis-cli -a $REDIS_PASSWORD ping
```

### 11.6 Guncelleme Proseduru

```bash
cd /opt/nettapu/platform

# En son kodu cek
git pull origin main

# Yeniden olustur ve baslat (sifir kesinti)
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Migration varsa calistir
docker exec nettapu-monolith npm run migration:run
```

---

## 12. Mobil Uygulama Hesaplari

### 12.1 Apple Developer Program

**Fiyat:** $99/yil (~4.401 TL)
**Link:** https://developer.apple.com/programs/

#### Kayit Adimlari

1. https://developer.apple.com/account adresine gidin
2. Apple ID ile giris yapin (yoksa olusturun)
3. "Join the Apple Developer Program" tiklayin
4. Hesap tipi: **Organization** (sirket) secin
5. Gereken bilgiler:
   - D-U-N-S numarasi (ucretsiz alinir: https://developer.apple.com/enroll/duns-lookup/)
   - Sirket yasal unvani
   - Sirket web sitesi
   - Yetkili kisi bilgileri
6. $99 odeme yapin
7. Onay sureci: 1-4 hafta (organizasyon icin)

#### App Store Icin Gerekenler

- Uygulama ikonu: 1024x1024 px
- Ekran goruntuleri: iPhone (6.7", 6.5", 5.5"), iPad (12.9")
- Uygulama aciklamasi (Turkce + Ingilizce)
- Gizlilik politikasi URL'si
- Destek URL'si

### 12.2 Google Play Developer

**Fiyat:** $25 tek seferlik
**Link:** https://play.google.com/console/signup

#### Kayit Adimlari

1. https://play.google.com/console/signup adresine gidin
2. Google hesabiyla giris yapin
3. Hesap tipi: **Organization** secin
4. $25 odeme yapin
5. Kimlik dogrulama (D-U-N-S veya resmi belgeler)
6. Onay sureci: 2-7 gun

#### Google Play Icin Gerekenler

- Uygulama ikonu: 512x512 px
- Ozellik gorseli: 1024x500 px
- Ekran goruntuleri: en az 2, en fazla 8 adet
- Uygulama aciklamasi (kisa: 80 karakter, uzun: 4000 karakter)
- Gizlilik politikasi URL'si
- Icerik derecelendirmesi anketi

---

## 13. Maliyet Tahmini

### 13.1 Aylik Sabit Giderler

| Kalem | Saglayici | Fiyat (USD) | Fiyat (TRY)* |
|-------|-----------|-------------|--------------|
| Sunucu (VPS) | Hetzner CPX41 | ~$34/ay | ~1.512 TL/ay |
| E-posta | SendGrid Free | $0/ay | 0 TL/ay |
| SMS | NetGSM | ~$15-30/ay | ~667-1.334 TL/ay |
| CDN | Cloudflare Free | $0/ay | 0 TL/ay |
| SSL | Let's Encrypt | $0/ay | 0 TL/ay |
| Dosya depolama | Cloudflare R2 (50GB) | ~$1/ay | ~44 TL/ay |
| **Aylik Toplam** | | **~$50-65/ay** | **~2.223-2.890 TL/ay** |

### 13.2 Yillik Giderler

| Kalem | Saglayici | Fiyat (USD) | Fiyat (TRY)* |
|-------|-----------|-------------|--------------|
| Domain (.com) | Namecheap | ~$12/yil | ~534 TL/yil |
| Apple Developer | Apple | $99/yil | ~4.401 TL/yil |
| Google Play | Google | $25 (tek sefer) | ~1.112 TL (tek sefer) |

### 13.3 Toplam Ilk Yil Maliyeti

| Kalem | Tutar (USD) | Tutar (TRY)* |
|-------|-------------|--------------|
| Sunucu (12 ay) | ~$408 | ~18.140 TL |
| SMS (12 ay) | ~$180-360 | ~8.003-16.006 TL |
| Domain | ~$12 | ~534 TL |
| Apple Developer | $99 | ~4.401 TL |
| Google Play | $25 | ~1.112 TL |
| Dosya depolama (12 ay) | ~$12 | ~534 TL |
| **Ilk Yil Toplami** | **~$736-916** | **~32.724-40.727 TL** |

> *TRY fiyatlari yaklasik olup 1 USD = 44,46 TL kuruna gore hesaplanmistir (Mart 2026). Guncel kuru kontrol edin.*

### 13.4 Olcekleme Senaryolari

Kullanici sayisi arttikca:

| Senaryo | Aylik Ek Maliyet |
|---------|------------------|
| SendGrid Essentials (50K e-posta) | +$20/ay |
| Hetzner ust plan (16 vCPU / 32GB) | +$30/ay |
| Ikinci sunucu (yuk dengeleme) | +$34/ay |
| NetGSM buyuk paket | +$20-40/ay |

---

## 14. Son Kontrol Listesi

Asagidaki listeyi uretim ortamina gecmeden once eksiksiz tamamlayin:

### Domain ve DNS
- [ ] Domain satin alindi
- [ ] DNS A kayitlari olusturuldu (nettapu.com, api, app, admin)
- [ ] Nameserver'lar Cloudflare'e yonlendirildi
- [ ] DNS yayilimi tamamlandi (24-48 saat)

### Sunucu
- [ ] VPS satin alindi ve kuruldu
- [ ] Ubuntu 22.04 LTS yuklendi
- [ ] SSH anahtar ile erisim aktif
- [ ] Root girisi kapatildi
- [ ] SSH portu degistirildi (2222)
- [ ] UFW guvenlik duvari aktif
- [ ] Fail2Ban kuruldu
- [ ] Swap alani olusturuldu (8 GB RAM ise)
- [ ] Docker ve Docker Compose kuruldu
- [ ] Nginx kuruldu

### SSL
- [ ] Let's Encrypt sertifikasi alindi (tum subdomain'ler)
- [ ] Otomatik yenileme testi yapildi
- [ ] HTTPS yonlendirmesi calisiyor

### Veritabani
- [ ] PostgreSQL + PostGIS Docker'da calisiyor
- [ ] Veritabani ve kullanici olusturuldu
- [ ] Schema'lar olusturuldu
- [ ] Migration'lar calistirildi
- [ ] Yedekleme cron gorevi aktif
- [ ] Yedekleme testi yapildi (restore denendi)

### Redis
- [ ] Redis Docker'da calisiyor
- [ ] Sifre korumasi aktif
- [ ] AOF persistence aktif

### Odeme
- [ ] PayTR hesabi olusturuldu ve onaylandi
- [ ] PayTR API anahtarlari alindi
- [ ] PayTR sandbox testi yapildi
- [ ] iyzico hesabi olusturuldu ve onaylandi (yedek)
- [ ] iyzico API anahtarlari alindi
- [ ] Canli odeme testi yapildi (kucuk tutarla)

### E-posta
- [ ] SendGrid hesabi olusturuldu
- [ ] API anahtari olusturuldu
- [ ] Domain dogrulamasi tamamlandi (SPF, DKIM, DMARC)
- [ ] Test e-postasi gonderildi ve alindi

### SMS
- [ ] NetGSM hesabi olusturuldu
- [ ] Baslik (sender ID) basvurusu yapildi
- [ ] Baslik onaylandi (BTK)
- [ ] Test SMS gonderildi ve alindi

### Dosya Depolama
- [ ] Cloudflare R2 bucket olusturuldu
- [ ] API token'lari olusturuldu
- [ ] Custom domain ayarlandi (media.nettapu.com)
- [ ] Dosya yukleme/okuma testi yapildi

### CDN
- [ ] Cloudflare hesabi olusturuldu
- [ ] Site eklendi
- [ ] SSL modu: Full (Strict) ayarlandi
- [ ] WebSockets aktif
- [ ] Guvenlik ayarlari yapildi

### Uygulama
- [ ] .env dosyasi olusturuldu (tum degiskenler dolduruldu)
- [ ] Docker imajlari olusturuldu
- [ ] Tum servisler calisiyor (postgres, redis, monolith, auction, web)
- [ ] Saglik kontrolleri gecti
- [ ] API erisimi calisiyor (https://api.nettapu.com/health)
- [ ] Web sitesi erisimi calisiyor (https://nettapu.com)
- [ ] Admin paneli erisimi calisiyor (https://admin.nettapu.com)
- [ ] WebSocket baglantisi calisiyor

### Mobil
- [ ] Apple Developer hesabi olusturuldu
- [ ] Google Play Developer hesabi olusturuldu
- [ ] Uygulama ikonu ve ekran goruntuleri hazirlandi

### Guvenlik
- [ ] Tum sifreleri guclu ve benzersiz (openssl rand ile)
- [ ] .env dosyasi Git'e eklenmemis
- [ ] Veritabani portu disariya kapali (127.0.0.1)
- [ ] Redis portu disariya kapali (127.0.0.1)
- [ ] CORS dogru ayarlanmis
- [ ] Rate limiting aktif

### Izleme ve Yedekleme
- [ ] Veritabani yedekleme cron aktif
- [ ] Log dosyalari izleniyor
- [ ] Disk alani izleniyor
- [ ] Uzak yedekleme ayarlandi

---

## Ek: Faydali Komutlar

### Servis Yonetimi

```bash
# Tum servisleri baslat
docker compose -f docker-compose.prod.yml up -d

# Tum servisleri durdur
docker compose -f docker-compose.prod.yml down

# Tek servisi yeniden baslat
docker compose -f docker-compose.prod.yml restart monolith

# Loglari izle
docker compose -f docker-compose.prod.yml logs -f monolith

# Disk kullanimi
docker system df

# Kullanilmayan imajlari temizle
docker system prune -a
```

### Veritabani

```bash
# Veritabanina baglan
docker exec -it nettapu-postgres psql -U nettapu_admin -d nettapu_production

# Manuel yedek al
docker exec nettapu-postgres pg_dump -U nettapu_admin -d nettapu_production > backup.sql

# Yedekten geri yukle
docker exec -i nettapu-postgres psql -U nettapu_admin -d nettapu_production < backup.sql
```

### Izleme

```bash
# Sunucu kaynaklari
htop

# Disk alani
df -h

# Docker konteyner kaynaklari
docker stats

# Nginx loglari
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

> **Bu belge, NetTapu platformunun uretim ortamina alinmasi icin gereken tum adimlari kapsamaktadir. Sorulariniz icin gelistirme ekibiyle iletisime gecin.**
