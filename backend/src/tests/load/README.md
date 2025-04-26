# K6 Load Testing for Stock Transfer API

Bu klasör, Gold 360 uygulamasının StockTransfer API'sini yük testi altında değerlendirmek için k6 yük testi senaryolarını içerir.

## k6 Nedir?

k6, modern performans testi aracıdır. JavaScript kullanarak senaryolar yazmanıza olanak tanır ve ölçeklenebilir, dağıtılmış yük testleri yapmanıza olanak tanır.

## Kurulum

**Not:** Sisteminizde k6 zaten yüklü ve v1.0.0-rc1 sürümünü kullanmaktasınız. Eğer farklı bir sistemde çalıştıracaksanız, o sistem için aşağıdaki kurulum adımlarını izleyebilirsiniz.

K6'yı aşağıdaki yöntemlerden biriyle kurabilirsiniz:

### macOS için:

```
brew install k6
```

### Linux için:

```
# Anahtar ekle
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69

# Repository ekle
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list

# k6'yı kur
sudo apt-get update
sudo apt-get install k6
```

### Windows için:

```
choco install k6
```

Veya:

```
winget install k6 --source winget
```

### Docker ile:

```
docker pull grafana/k6
```

## Kullanımı

StockTransfer API yük testini çalıştırmak için:

```
# NPM script ile çalıştırma
npm run test:load:stock-transfer

# veya doğrudan k6 ile çalıştırma
k6 run src/tests/load/stockTransfer.load.test.js
```

## Test Ortamı Ayarları

Test ortamınıza göre parametreleri değiştirmek için çevre değişkenlerini kullanabilirsiniz:

```
BASE_URL=https://api.staging.gold360.com API_TOKEN=your_token SLEEP_DURATION=0.5 k6 run src/tests/load/stockTransfer.load.test.js
```

## API Endpoint Yapısı

Test dosyasındaki endpoint'ler, API'nizin yapısına göre düzenlenmiştir:

- GET `/stock-transfers` - Tüm transferleri listeler
- GET `/stock-transfers/:id` - Belirli bir transferin detaylarını getirir
- POST `/stock-transfers` - Yeni bir transfer oluşturur 
- PUT `/stock-transfers/:id/status` - Transfer durumunu günceller
- DELETE `/stock-transfers/:id` - Bir transferi siler

Eğer API endpoint'leriniz farklıysa, test dosyasındaki `BASE_URL` değişkenini ve endpoint yollarını düzenleyin.

## Mevcut Testler

### stockTransfer.load.test.js

Bu test senaryosu şunları içerir:

1. Tüm stok transferlerini listeleme
2. Belirli bir stok transferini ID ile alma
3. Yeni stok transferi oluşturma
4. Stok transferi durumunu güncelleme
5. Stok transferi silme (düşük oranda)

## Test Sonuçlarını Anlama

Test sonuçlarında aşağıdaki metriklere dikkat edin:

- **transfer_get_duration**: Stok transferi listeleme ve detay görüntüleme isteklerinin süresi
- **transfer_create_duration**: Stok transferi oluşturma isteklerinin süresi
- **transfer_update_duration**: Stok transferi güncelleme isteklerinin süresi
- **error_rate**: Tüm isteklerdeki hata oranı

## Grafana ve InfluxDB ile İzleme

Testleri sürekli çalıştırıp sonuçları izlemek için, k6 çıktısını InfluxDB'ye aktarabilir ve Grafana ile görselleştirebilirsiniz:

```
k6 run --out influxdb=http://localhost:8086/k6 src/tests/load/stockTransfer.load.test.js
```

## Test Eşikleri

Mevcut testler aşağıdaki eşikleri kontrol eder:

- Get isteklerinin %95'i <1000ms içinde tamamlanmalı
- Create isteklerinin %95'i <2000ms içinde tamamlanmalı
- Update isteklerinin %95'i <2000ms içinde tamamlanmalı
- Tüm isteklerin %95'i <2000ms içinde tamamlanmalı
- Hata oranı %10'dan az olmalı 