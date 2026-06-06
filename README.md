# AtibayCRM - Apartman ve Site Yönetim Sistemi

Bu proje; yöneticilerin birden fazla binayı/apartmanı tek bir panelden yönetebilmesini, daire sakinlerinin kendi cari detaylarına erişebilmesini, anketlere katılmasını ve arıza talepleri açabilmesini sağlayan uçtan uca bir CRM ve muhasebe otomasyon sistemidir.

Proje üç ana bileşenden oluşmaktadır:
1. **Backend API (`/backend`):** Express.js tabanlı, verileri yerel `db.json` dosyasında saklayan ve frontend/mobil ile senkronize çalışan veri sunucusu.
2. **Yönetici Paneli (`/admin-panel`):** Vite + React (TypeScript) ve Lucide Icons kullanan, GitHub Actions ile otomatik olarak GitHub Pages üzerinde konuşlandırılan modern web arayüzü.
3. **Mobil Uygulama (`/mobile-app`):** Sakinlerin kendi daire bilgilerini görmesi, arıza kayıtları oluşturması ve anketlere katılması için React Native (Expo) tabanlı uygulama.

---

## 🛠️ Son Yapılan Geliştirmeler ve Mevcut Durum

En son aşamada aşağıdaki özellikler başarıyla tamamlanmış, test edilmiş ve production derlemeleri (`npm run build`) doğrulanmıştır:

### 1. Sakin Hesap Kartı ve Cari CRUD İşlemleri
* Sakin Detay Modalındaki geçmiş hesap hareketleri tablosuna **Düzenleme** ve **Silme** işlemleri eklendi.
* Bu işlemler yapıldığında sakinlerin **Güncel Bakiye (`balance`)** ve ilgili aya ait **Ödenen Tutar (`paidAmount`)** alanları otomatik ve tutarlı bir şekilde senkronize edilerek yeniden hesaplanır.
* Modallar arası katmanlaşma sorunu çözüldü; sakin kartının içinden bir işlem düzenlenmek istendiğinde ilgili Gelir/Gider düzenleme modalları sakin kartının üstünde (`zIndex: 1100`) açılır.

### 2. PDF / Yazdırma Raporlama Motoru
* Sakin Hesap Kartı modalına **"Yazdır / PDF"** butonu eklendi.
* Butona tıklandığında, ilgili sakinin künyesini, borç/alacak bakiyesini ve tüm işlem geçmişini içeren şık ve yazdırılmaya hazır bir rapor sayfası yeni sekmede açılır ve otomatik olarak tarayıcı yazdırma/PDF kaydetme penceresi tetiklenir.

### 3. Bina Seçimli Excel Yakıt Gideri Dağıtımı
* Excel’den kopyalanan yakıt gider listelerinin (daire no ve tutar içeren) sisteme yapıştırılarak paylaştırıldığı modüle dinamik bir **Bina Seçim Dropdown'ı** eklendi.
* Yönetici artık yakıt listesini yüklerken doğrudan modal içinden hedef binayı seçebilir. Bina değiştirildiğinde simülasyon listesi otomatik temizlenir ve yeni binanın sakinleriyle anlık eşleşme sağlanır.

### 4. Hata ve Kural İhlali Düzeltmeleri
* Admin panel sekmeleri arasında geçiş yapıldığında oluşan React Hooks kural ihlalleri (koşullu render içinde hook kullanımı) giderildi ve sekmeler kararlı hale getirildi.

---

## 🚀 Başka Bir Bilgisayarda Kurulum ve Çalıştırma

Projeyi başka bir bilgisayarda açtığınızda çalıştırmak için aşağıdaki adımları sırayla izleyin:

### 1. Projeyi İndirme / Klonlama
```bash
git clone https://github.com/ismailbayram87-coder/crnyonetim.git
cd crnyonetim
```

### 2. Backend Sunucusunu Başlatma
Express backend sunucusu `http://localhost:5000` portunda çalışır ve frontend ile mobil uygulamaya veri sağlar.
```bash
cd backend
npm install
node server.js
```

### 3. Yönetici Panelini Çalıştırma
Yönetici paneli `http://localhost:5173` portunda ayağa kalkar.
```bash
cd admin-panel
npm install
npm run dev
```
* **Canlı Yayın (Deploy):** Projede `.github/workflows/deploy.yml` dosyası bulunmaktadır. `main` dalına (branch) yapılan her `git push` sonrasında GitHub Actions projeyi otomatik olarak derler ve [GitHub Pages](https://ismailbayram87-coder.github.io/crnyonetim/) üzerinde yayınlar.

### 4. Mobil Uygulamayı Çalıştırma
```bash
cd mobile-app
npm install
npx expo start
```

---

## 🤖 AI / Geliştirici Kaldığı Yerden Devam Kılavuzu

Eğer bu projeyi bir yapay zeka kodlama asistanı (Antigravity vb.) veya başka bir geliştirici ile sürdürecekseniz, kaldığı yeri ve sistem detaylarını hatırlaması için aşağıdaki notları göz önünde bulundurması gerekir:

1. **Aktif Veri Dosyaları:**
   * Projenin veri tabanı `/backend/db.json` dosyasıdır.
   * `admin-panel/src/App.tsx` içerisindeki `useEffect` kancası, durumdaki (`residents`, `transactions`, vb.) her değişimi otomatik olarak `http://localhost:5000/api/save` API ucuna POST ederek `db.json` dosyasını günceller.
2. **Kritik Kod Konumları (admin-panel):**
   * Cari düzenleme/silme senkronizasyon mantığı: `adjustResidentBalanceOnTransactionDelete` ve `adjustResidentBalanceOnTransactionEdit` fonksiyonları (`admin-panel/src/App.tsx`).
   * PDF Raporlama şablonu ve yazdırma fonksiyonu: `handlePrintResidentPDF` metodu (`admin-panel/src/App.tsx`).
   * Yakıt gideri çözümleme mantığı: `handleParseFuelExcel` ve `handleApplyFuelExpense` metotları (`admin-panel/src/App.tsx`).
3. **Kapsamlı Geçmiş Bilgisi:**
   * Detaylı analiz adımları, planlamalar ve önceki çalışmalar için proje kök dizininde veya `.gemini` / `.brain` klasöründe yer alan `walkthrough.md`, `task.md` ve `implementation_plan.md` dosyalarını inceleyin.
