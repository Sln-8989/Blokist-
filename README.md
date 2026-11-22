# Blok Rehberi – Rejyonel Blok

Anestezi hekimleri için kılavuz tabanlı rejyonel blok karar rehberi. Cerrahiye, hasta faktörlerine ve antitrombotik ilaca göre blok seçeneklerini kaynaklarıyla gösterir. İnternetsiz çalışır.

**Uygulama:** https://sln-8989.github.io/Blokist-/
**Gizlilik politikası:** https://sln-8989.github.io/Blokist-/gizlilik.html

> Yalnızca hekim kullanımı içindir. Klinik yargının yerini tutmaz ve tıbbi cihaz olarak kayıtlı değildir.

## Kurulum (telefon ve bilgisayar)

- **iPhone/iPad:** Safari'de adresi açın → Paylaş → Ana Ekrana Ekle.
- **Android:** Chrome'da adresi açın → ⋮ → Uygulamayı yükle.
- **Bilgisayar:** Chrome veya Edge'de adresi açın → adres çubuğundaki yükle simgesi.

Bir kez internetle açtıktan sonra internetsiz çalışır.

## Dosyalar

| Dosya | Görev |
| --- | --- |
| index.html | Sayfa |
| app.js | Uygulama kodu |
| sw.js | İnternetsiz çalışma (önbellek) |
| manifest.webmanifest, icon.png | Ana ekran simgesi ve adı |
| gizlilik.html | Gizlilik politikası |
| data/*.json | İçerik: kaynaklar, cerrahi bloklar, antitrombotik, komorbidite, kanıt panelleri, USG bağlantıları, doğrulama |

İçerik güncellemesi için yalnızca `data/` klasöründeki JSON dosyaları değiştirilir. Her dosyanın sürümü ve kontrol tarihi uygulamanın ana sayfasında görünür.

## Kaynaklar

Öneriler ESRA PROSPECT, ESAIC/ESRA, ASRA kılavuzları ile meta-analiz ve randomize çalışmalara dayanır; her öneri uygulamada kaynağına bağlanır.
