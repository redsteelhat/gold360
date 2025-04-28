import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-text-primary">
              <span className="text-gold-primary">Gold</span>360
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-text-primary hover:text-gold-primary">
              Giriş
            </Link>
            <Link href="/register" className="btn-primary">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-bg-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
                <span className="text-gold-primary">Kuyumcu İşletmeleri</span> İçin Eksiksiz Dijital Çözüm
              </h1>
              <p className="text-lg text-text-secondary mb-8">
                Kuyumcular için özel olarak tasarlanmış e-ticaret, envanter yönetimi, CRM ve pazarlama araçlarını içeren hepsi bir arada platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="btn-primary text-center">
                  Ücretsiz Deneyin
                </Link>
                <Link href="/demo" className="btn-secondary text-center">
                  Demo Talep Et
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative h-80 w-80 md:h-96 md:w-96">
                {/* Placeholder for hero image */}
                <div className="absolute inset-0 bg-gold-primary/20 rounded-full"></div>
                <div className="absolute inset-4 bg-gold-primary/30 rounded-full"></div>
                <div className="absolute inset-8 bg-white shadow-xl rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-gold-primary">Gold360</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-gold-primary">Kuyumcu İşletmenizi Büyütmek</span> İçin İhtiyacınız Olan Her Şey
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-gold-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-gold-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">E-Ticaret ve Satış</h3>
              <p className="text-text-secondary">
                Güvenli ödeme sistemi ve güzel ürün vitriniyle mücevherlerinizi çevrimiçi satın.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="card hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-gold-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-gold-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Envanter Yönetimi</h3>
              <p className="text-text-secondary">
                Stok seviyelerini takip edin, birden fazla mağazayı yönetin ve düşük stok uyarıları alın.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="card hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-gold-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-gold-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">CRM ve Müşteri Sadakati</h3>
              <p className="text-text-secondary">
                Ödül programları ve kişiselleştirilmiş pazarlama ile müşteri ilişkilerini geliştirin.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-gold-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-gold-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Raporlama ve Analiz</h3>
              <p className="text-text-secondary">
                Kapsamlı raporlar ve panolarla veri odaklı kararlar alın.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="card hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-gold-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-gold-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobil Uygulama</h3>
              <p className="text-text-secondary">
                iOS ve Android mobil uygulamalarıyla işletmenizi hareket halindeyken yönetin.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="card hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-gold-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-gold-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pazarlama Yönetimi</h3>
              <p className="text-text-secondary">
                E-posta kampanyaları, sosyal medya ve promosyonlar oluşturun ve otomatikleştirin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gold-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Kuyumcu İşletmenizi Dönüştürmeye Hazır Mısınız?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Satışlarını artırmak ve operasyonlarını düzenlemek için Gold360'ı kullanan yüzlerce kuyumcu işletmesine katılın.
          </p>
          <Link href="/register" className="inline-block bg-white text-gold-primary font-medium py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-300">
            14 Günlük Ücretsiz Deneme Başlatın
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                <span className="text-gold-primary">Gold</span>360
              </h2>
              <p className="text-white/70">
                Kuyumcu işletmeleri için eksiksiz dijital çözüm.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Ürün</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-white/70 hover:text-white">Özellikler</Link></li>
                <li><Link href="/pricing" className="text-white/70 hover:text-white">Fiyatlandırma</Link></li>
                <li><Link href="/demo" className="text-white/70 hover:text-white">Demo Talep Et</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Şirket</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/70 hover:text-white">Hakkımızda</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white">İletişim</Link></li>
                <li><Link href="/blog" className="text-white/70 hover:text-white">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Yasal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-white/70 hover:text-white">Kullanım Koşulları</Link></li>
                <li><Link href="/privacy" className="text-white/70 hover:text-white">Gizlilik Politikası</Link></li>
                <li><Link href="/cookies" className="text-white/70 hover:text-white">Çerez Politikası</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/70">
            <p>© {new Date().getFullYear()} Gold360. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </main>
  );
} 