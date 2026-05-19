Ürün Gereksinim Belgesi (PRD): Apartman Yönetim Sistemi
Versiyon: 1.0
Durum: Taslak
Hedef Platform: Android (Mobil) & Web (Yönetim Paneli)
1. Ürün Özeti
Bu proje, apartman ve site yöneticilerinin finansal süreçlerini dijitalleştiren, manuel veri girişine dayalı ancak yüksek şeffaflık sunan bir yönetim platformudur. Sistem, yöneticilerin web üzerinden hızlıca veri girişi yapabileceği bir panel ve sakinlerin tüm süreci izleyebileceği bir mobil uygulamadan oluşur.
2. Kullanıcı Rolleri
Yönetici: Web panelini kullanarak gelir/gider kaydı girer, fatura görseli yükler ve duyuru yayınlar.
Sakin: Mobil uygulama üzerinden apartman kasasını, kendi borç durumunu ve yönetimin yüklediği fatura görsellerini görüntüler.
3. Temel Fonksiyonel Gereksinimler
3.1. Finansal Şeffaflık Modülü (Kritik)
Sanal POS içermeyen, tamamen manuel kayıt ve raporlama üzerine kurulu bir yapıdır.
Özellik                                         Açıklama
Gelir Kaydı                             Yöneticinin elden veya banka yoluyla gelen aidatları daire bazlı manuel işlemesi.
Gider ve Fatura Yönetimi                Yapılan her harcamanın (elektrik, asansör, temizlik vb.) fotoğrafının çekilerek sisteme yüklenmesi.
Otomatik Raporlama                      Girilen verilerden hareketle apartman gelir-gider tablosunun ve kasa bakiyesinin otomatik oluşturulması.
Sakin Borç Takibi                       Sakinlerin güncel borçlarını ve geçmiş ödemelerini mobil uygulama üzerinden görebilmesi.

3.2. Yönetici Web Paneli
Hızlı Veri Girişi: Toplu aidat tahakkuku ve kolay gider girişi için optimize edilmiş masaüstü arayüzü.
Veri Saklama: Tüm veritabanı bu panelin bağlı olduğu bulut sisteminde (Database) saklanır.
Kullanıcı Yönetimi: Sakin listesini (isim, daire no, telefon) içe aktarma ve düzenleme.
3.3. Mobil Uygulama (Sakin Paneli)
Görsel Arşiv: Yöneticinin yüklediği harcama faturalarının kronolojik olarak listelenmesi ve tam ekran görüntülenebilmesi.
Duyurular: Yönetimden gelen mesajların listelendiği dijital pano.
Push Bildirimleri: Yeni bir harcama girildiğinde veya aidat zamanı geldiğinde uygulama içi bildirimler.
3.4. İletişim Entegrasyonları
WhatsApp Entegrasyonu: Yönetici panelinden hazırlanan borç dökümünün veya duyurunun tek tıkla ilgili sakine WhatsApp üzerinden gönderilmesi (Faz 2).
4. Teknik Mimari ve Altyapı
Bulut Sistemi: Verilerin cihazlar arası senkronizasyonu ve fatura görsellerinin güvenli saklanması için Google Firebase veya benzeri bir bulut altyapısı kullanılacaktır.
Veritabanı: Merkezi bulut veritabanı (NoSQL veya Relational), tüm platformların tek bir kaynaktan beslenmesini sağlar.
Mobil Teknoloji: Flutter veya React Native (Tek seferlik satın alma modeline uygun).
5. İş Modeli
Satış Kanalı: Google Play Store.
Fiyatlandırma: Tek seferlik ücretli uygulama satın alımı. Abonelik veya uygulama içi satış bulunmamaktadır.
Not: Bu belge projenin temel çerçevesini belirler. Geliştirme aşamasında WhatsApp API kısıtlamaları veya bulut depolama maliyetleri ayrıca değerlendirilmelidir.
