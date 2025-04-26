# StockTransfer K6 Yük Testi Kurulum Özeti

## Tamamlanan İşlemler

1. **NPM Script Eklendi**: `package.json` dosyasına StockTransfer modülü için k6 yük testini çalıştıracak script eklendi:
   ```
   "test:load:stock-transfer": "k6 run src/tests/load/stockTransfer.load.test.js"
   ```

2. **Test Klasörü Oluşturuldu**: Yük testleri için `src/tests/load` klasörü oluşturuldu.

3. **StockTransfer Yük Testi Dosyası Oluşturuldu**: `stockTransfer.load.test.js` dosyası oluşturuldu ve aşağıdaki test senaryoları eklendi:
   - Tüm transferleri listeleme
   - ID ile bir transfer detaylarını görüntüleme
   - Yeni transfer oluşturma
   - Transfer durumu güncelleme
   - Transfer silme (düşük olasılıkla)

4. **README Dosyası Oluşturuldu**: Yük testlerinin nasıl kullanılacağını açıklayan detaylı bir README dosyası oluşturuldu.

5. **K6 Kontrol Edildi**: Sistemde k6'nın yüklü olduğu ve v1.0.0-rc1 sürümünün kullanıldığı doğrulandı.

## Test Metrikleri

Oluşturulan yük testleri aşağıdaki metrikleri ölçmektedir:

- **transfer_get_duration**: GET isteklerinin cevap süresi
- **transfer_create_duration**: POST (oluşturma) isteklerinin cevap süresi
- **transfer_update_duration**: PUT (güncelleme) isteklerinin cevap süresi
- **error_rate**: Başarısız isteklerin oranı

## Test Eşikleri

Test aşağıdaki performans eşikleri ile konfigüre edilmiştir:

- GET isteklerinin %95'i 1000ms altında tamamlanmalı
- CREATE isteklerinin %95'i 2000ms altında tamamlanmalı
- UPDATE isteklerinin %95'i 2000ms altında tamamlanmalı
- Tüm isteklerin %95'i 2000ms altında tamamlanmalı
- Hata oranı %10'dan az olmalı

## Yük Profili

Test, aşağıdaki aşamalardan oluşan bir yük profili kullanmaktadır:

1. 30 saniye içinde 5 kullanıcıya kadar yukarı çıkma
2. 1 dakika içinde 10 kullanıcıya çıkma
3. 2 dakika boyunca 10 kullanıcıda sabit kalma
4. 30 saniye içinde 0 kullanıcıya düşme

## Çalıştırma Talimatları

Testi çalıştırmak için:

```bash
# NPM script kullanarak
npm run test:load:stock-transfer

# veya doğrudan k6 komutu ile
k6 run src/tests/load/stockTransfer.load.test.js
```

## Test Ortamını Özelleştirme

Test ortamı parametrelerini değiştirmek için:

```bash
BASE_URL=http://localhost:5000 API_TOKEN=your_token SLEEP_DURATION=0.5 npm run test:load:stock-transfer
```

## Bir Sonraki Adımlar

1. **Gerçekçi Test Verileri**: Test için test ortamında gerçekçi verilerin (ürünler, depolar, kullanıcılar) olduğundan emin olun.

2. **API Token Güncelleme**: Test dosyasındaki varsayılan API token'ı gerçek test ortamınıza uygun bir değer ile güncelleyin.

3. **Eşik Değerlerini İnce Ayarlama**: Test eşiklerini uygulamanızın gerçek performans ihtiyaçlarına göre ayarlayın.

4. **CI/CD Entegrasyonu**: Yük testlerini CI/CD pipeline'ına ekleyerek otomatik olarak çalıştırılmasını sağlayın.

5. **Performans İzleme**: InfluxDB ve Grafana gibi araçları kullanarak performans metriklerini sürekli izleyin ve analiz edin.

## Notlar

- Testler hem başarı/başarısızlık kontrolleri hem de performans metrikleri toplamak için tasarlanmıştır.
- Test dosyası çevre değişkenleri ile kolayca konfigüre edilebilir.
- Gerçek ortamda çalıştırmadan önce test eşik değerlerinin gerçekçi olduğundan emin olun. 