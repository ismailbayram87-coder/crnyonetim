import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Image, 
  Platform, 
  UIManager, 
  TextInput, 
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'home' | 'announcements' | 'receipts' | 'gas' | 'profile';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Host detection for native android emulator / ios simulator / web
const API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/api' 
  : 'http://localhost:5000/api';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

// Simple zero-config memory/web local storage wrapper
const nativeMemoryStore: Record<string, string> = {};
const sessionStore = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return nativeMemoryStore[key] || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      nativeMemoryStore[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      delete nativeMemoryStore[key];
    }
  }
};

interface Apartment {
  id: string;
  name: string;
  duesDay: number;
  duesAmount: number;
}

interface MonthlyRecord {
  dues: number;
  previousDebt: number;
  gasDelay: number;
  gasOther: number;
  paidAmount: number;
  paymentChannel: string;
  paymentDate: string;
}

interface Resident {
  id: string;
  apartmentId: string;
  name: string;
  aptNo: string;
  phone: string;
  balance: number;
  type: 'kiraci' | 'ev_sahibi';
  dues?: number;
  previousDebt?: number;
  gasDelay?: number;
  gasOther?: number;
  paidAmount?: number;
  paymentChannel?: string;
  paymentDate?: string;
  monthlyData?: Record<string, MonthlyRecord>;
  password?: string;
  isPasswordChanged?: boolean;
  ownerName?: string;
  ownerPhone?: string;
  tenantName?: string;
  tenantPhone?: string;
  duesGroupId?: string;
}

interface Transaction {
  id: string;
  apartmentId?: string;
  type: 'income' | 'expense' | 'personnel_expense' | 'other_expense';
  amount: number;
  description: string;
  date: string;
  residentId?: string;
  receiptUrl?: string;
  vendorId?: string;
  status?: 'Ödendi' | 'Ödenmedi';
  dueDate?: string;
  debtorType?: 'kiraci' | 'ev_sahibi';
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  targetBuildingId: string;
  votes: Record<string, string>; // residentId -> option
  active: boolean;
  date: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  residentId: string;
  apartmentId: string;
  status: 'Açık' | 'İşlemde' | 'Çözüldü';
  priority: 'Düşük' | 'Orta' | 'Yüksek';
  createdAt: string;
  assignedStaffId: string | null;
  resolutionNotes: string;
}

export default function App() {
  // App States
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(true);
  
  // Database States
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Session States
  const [loggedInResidentId, setLoggedInResidentId] = useState<string | null>(null);
  const [selectedAptId, setSelectedAptId] = useState<string>('apt_elitkent_b');
  const [selectedResId, setSelectedResId] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Password Change State
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');

  // New Ticket Modal State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'Düşük' | 'Orta' | 'Yüksek'>('Orta');

  // Load Database from Server
  const loadDatabase = async () => {
    try {
      const res = await fetch(`${API_URL}/db`);
      const data = await res.json();
      
      setApartments(data.apartments || []);
      setResidents(data.residents || []);
      setTransactions(data.transactions || []);
      setPolls(data.polls || []);
      setTickets(data.tickets || []);
      
      // Seed default selections
      if (data.apartments && data.apartments.length > 0) {
        setSelectedAptId(data.apartments[0].id);
      }
    } catch (err) {
      console.warn("Backend API not reachable. Using fallback mock data:", err);
      // Fallback Seed Data (Elitkent B Blok)
      setApartments([{ id: 'apt_elitkent_b', name: 'Elitkent Sitesi B Blok', duesDay: 15, duesAmount: 1000 }]);
      setResidents([
        { id: 'elitkent_1', apartmentId: 'apt_elitkent_b', name: 'Recep AVALI', aptNo: '1', phone: '05301112233', balance: 0, type: 'ev_sahibi', dues: 1000, password: '123456', isPasswordChanged: false },
        { id: 'elitkent_2', apartmentId: 'apt_elitkent_b', name: 'Recep BEKE', aptNo: '2', phone: '05321112233', balance: -1000, type: 'ev_sahibi', dues: 1000, password: '123456', isPasswordChanged: false },
        { id: 'elitkent_3', apartmentId: 'apt_elitkent_b', name: 'Mehmet Ali TİRYAKİ', aptNo: '3', phone: '05331112233', balance: 0, type: 'ev_sahibi', dues: 1000, password: '123456', isPasswordChanged: false },
        { id: 'elitkent_4', apartmentId: 'apt_elitkent_b', name: 'Cahit UÇAR', aptNo: '4', phone: '05341112233', balance: -350, type: 'ev_sahibi', dues: 1000, password: '123456', isPasswordChanged: false },
        { id: 'elitkent_5', apartmentId: 'apt_elitkent_b', name: 'Rıdvan HELVACI', aptNo: '5', phone: '05351112233', balance: 0, type: 'ev_sahibi', dues: 1000, password: '123456', isPasswordChanged: false }
      ]);
      setTransactions([
        { id: '1', apartmentId: 'apt_elitkent_b', type: 'expense', amount: 1200, description: 'Asansör Bakımı', date: '2026-01-05T08:00:00.000Z' },
        { id: '2', apartmentId: 'apt_elitkent_b', type: 'expense', amount: 350, description: 'Ortak Elektrik', date: '2026-01-01T08:00:00.000Z' },
        { id: '3', apartmentId: 'apt_elitkent_b', type: 'expense', amount: 800, description: 'Temizlik Gideri', date: '2025-12-28T08:00:00.000Z' },
      ]);
      setPolls([
        {
          id: "p1",
          question: "Dış cephe boyama rengi ne olmalıdır?",
          options: ["Bej", "Gri", "Yeşil"],
          targetBuildingId: "apt_elitkent_b",
          votes: {},
          active: true,
          date: "2026-06-06T11:00:00.000Z"
        }
      ]);
      setTickets([
        {
          id: "t_t1",
          title: "B Blok Asansör Arızası",
          description: "2. asansör yukarı çıkarken sarsıntı yapıyor ve ses çıkarıyor.",
          residentId: "elitkent_2",
          apartmentId: "apt_elitkent_b",
          status: "Açık",
          priority: "Yüksek",
          createdAt: "2026-06-06T10:00:00.000Z",
          assignedStaffId: null,
          resolutionNotes: ""
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Check storage on boot
  useEffect(() => {
    const checkSession = async () => {
      await loadDatabase();
      const savedResId = await sessionStore.getItem('crm_loggedInResidentId');
      if (savedResId) {
        setLoggedInResidentId(savedResId);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    if (!selectedResId) {
      setLoginError('Lütfen adınızı seçiniz.');
      return;
    }
    if (!passwordInput) {
      setLoginError('Lütfen şifrenizi giriniz.');
      return;
    }

    const resident = residents.find(r => r.id === selectedResId);
    if (!resident) {
      setLoginError('Kullanıcı bulunamadı.');
      return;
    }

    // Default password check "123456" if no password is set
    const userPass = resident.password || '123456';
    if (passwordInput !== userPass) {
      setLoginError('Hatalı şifre. Lütfen tekrar deneyin.');
      return;
    }

    // Check if password change is forced
    if (resident.isPasswordChanged === false && userPass === '123456') {
      setShowPasswordReset(true);
    } else {
      await sessionStore.setItem('crm_loggedInResidentId', resident.id);
      setLoggedInResidentId(resident.id);
      setPasswordInput('');
    }
  };

  const handlePasswordReset = async () => {
    setResetError('');
    if (!newPassword || newPassword.length < 4) {
      setResetError('Şifre en az 4 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Şifreler eşleşmiyor.');
      return;
    }

    const resId = selectedResId;
    try {
      // POST to backend API
      const response = await fetch(`${API_URL}/residents/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resId, password: newPassword })
      });

      if (response.ok) {
        // Update local state
        setResidents(prev => prev.map(r => r.id === resId ? { ...r, password: newPassword, isPasswordChanged: true } : r));
        
        await sessionStore.setItem('crm_loggedInResidentId', resId);
        setLoggedInResidentId(resId);
        
        // Clear forms
        setShowPasswordReset(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordInput('');
        if (Platform.OS === 'web') {
          alert('Şifreniz başarıyla güncellendi ve giriş yapıldı.');
        } else {
          Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi ve giriş yapıldı.');
        }
      } else {
        setResetError('Sunucu hatası. Şifre güncellenemedi.');
      }
    } catch (err) {
      console.warn("Backend not running, applying local password reset fallback:", err);
      setResidents(prev => prev.map(r => r.id === resId ? { ...r, password: newPassword, isPasswordChanged: true } : r));
      await sessionStore.setItem('crm_loggedInResidentId', resId);
      setLoggedInResidentId(resId);
      setShowPasswordReset(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordInput('');
    }
  };

  const handleLogout = async () => {
    await sessionStore.removeItem('crm_loggedInResidentId');
    setLoggedInResidentId(null);
    setSelectedResId('');
    setPasswordInput('');
    setActiveTab('home');
  };

  // Submit Vote
  const handleVote = async (pollId: string, option: string) => {
    if (!loggedInResidentId) return;
    try {
      const response = await fetch(`${API_URL}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residentId: loggedInResidentId, option })
      });
      if (response.ok) {
        const data = await response.json();
        // Sync local polls state
        setPolls(prev => prev.map(p => p.id === pollId ? data.poll : p));
      }
    } catch (err) {
      console.warn("Vote sync failed, updating locally:", err);
      setPolls(prev => prev.map(p => {
        if (p.id === pollId) {
          const updatedVotes = { ...(p.votes || {}), [loggedInResidentId]: option };
          return { ...p, votes: updatedVotes };
        }
        return p;
      }));
    }
  };

  // Open Ticket
  const handleCreateTicket = async () => {
    if (!loggedInResidentId) return;
    if (!ticketTitle || !ticketDesc) {
      if (Platform.OS === 'web') alert('Lütfen konu ve açıklama alanlarını doldurun.');
      else Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    const resident = residents.find(r => r.id === loggedInResidentId);
    if (!resident) return;

    const newTicket: Ticket = {
      id: 'ticket_' + Math.random().toString(),
      title: ticketTitle,
      description: ticketDesc,
      residentId: loggedInResidentId,
      apartmentId: resident.apartmentId,
      status: 'Açık',
      priority: ticketPriority,
      createdAt: new Date().toISOString(),
      assignedStaffId: null,
      resolutionNotes: ''
    };

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(prev => [data.ticket, ...prev]);
      }
    } catch (err) {
      console.warn("Ticket sync failed, adding locally:", err);
      setTickets(prev => [newTicket, ...prev]);
    }

    setTicketTitle('');
    setTicketDesc('');
    setTicketPriority('Orta');
    setIsTicketModalOpen(false);
    if (Platform.OS === 'web') alert('Arıza kaydı başarıyla açıldı.');
    else Alert.alert('Başarılı', 'Arıza kaydı başarıyla oluşturuldu.');
  };

  // Filter Data
  const currentResident = residents.find(r => r.id === loggedInResidentId);
  const currentApt = apartments.find(a => a.id === currentResident?.apartmentId);
  
  const buildingName = currentApt?.name || "Bina Bilgisi Yok";
  const myBalance = currentResident?.balance || 0;

  // Filter common expense transactions for this building
  const myBuildingTransactions = transactions.filter(t => 
    t.apartmentId === currentResident?.apartmentId && t.type === 'expense'
  );

  // Filter polls for this building or target 'all'
  const myBuildingPolls = polls.filter(p => 
    p.targetBuildingId === 'all' || p.targetBuildingId === currentResident?.apartmentId
  );

  // Filter tickets for this building
  const myBuildingTickets = tickets.filter(t => 
    t.apartmentId === currentResident?.apartmentId
  );

  // Constants for documents and receipts (seeding static visual archive)
  const receipts = [
    { id: 1, title: 'Ocak Ayı Ortak Elektrik', date: '15 Ocak 2026', image: 'https://via.placeholder.com/400x600.png?text=Elektrik+Faturasi' },
    { id: 2, title: 'Ocak Ayı Asansör Bakım Faturası', date: '12 Ocak 2026', image: 'https://via.placeholder.com/400x600.png?text=Asansor+Bakim' },
  ];

  const gasDocuments = [
    { id: 1, title: 'Ocak 2026 Doğalgaz Paylaşım Listesi', type: 'excel', date: '10 Ocak 2026', size: '28 KB' },
    { id: 2, title: 'Ocak 2026 Doğalgaz Ana Faturası', type: 'pdf', date: '08 Ocak 2026', size: '1.4 MB' },
  ];

  // RENDER LOADING
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>AtibayCRM Yükleniyor...</Text>
      </View>
    );
  }

  // RENDER LOGIN SCREEN
  if (!loggedInResidentId) {
    const aptResidents = residents.filter(r => r.apartmentId === selectedAptId);
    
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.loginScroll}>
          <View style={styles.loginCard}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="business" size={64} color="#3b82f6" style={{ marginBottom: 12 }} />
              <Text style={styles.loginTitle}>AtibayCRM Sakin Girişi</Text>
              <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                Apartman Sakin Bilgi portalına şifrenizle giriş yapınız.
              </Text>
            </View>

            {loginError ? (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                <Text style={styles.errorAlertText}>{loginError}</Text>
              </View>
            ) : null}

            {/* Bina Seçimi */}
            <Text style={styles.label}>Apartman / Bina</Text>
            <View style={styles.selectContainer}>
              <select 
                value={selectedAptId} 
                onChange={(e) => { setSelectedAptId(e.target.value); setSelectedResId(''); }}
                style={styles.webSelect}
              >
                {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </View>

            {/* Sakin Seçimi */}
            <Text style={styles.label}>Sakin Adı & Soyadı (Daire)</Text>
            <View style={styles.selectContainer}>
              <select 
                value={selectedResId} 
                onChange={(e) => setSelectedResId(e.target.value)}
                style={styles.webSelect}
              >
                <option value="">-- Adınızı Seçin --</option>
                {aptResidents.map(r => (
                  <option key={r.id} value={r.id}>Daire {r.aptNo} - {r.name} ({r.type === 'ev_sahibi' ? 'Sahibi' : 'Kiracı'})</option>
                ))}
              </select>
            </View>

            {/* Şifre Alanı */}
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="Şifre Giriniz (İlk Giriş: 123456)"
              placeholderTextColor="#475569"
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
            />

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginBtnText}>Sisteme Giriş Yap</Text>
            </TouchableOpacity>

            <Text style={{ color: '#475569', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
              💡 Not: İlk kez giriş yapıyorsanız varsayılan şifreniz "123456" olarak belirlenmiştir. İlk girişte şifrenizi güncellemeniz zorunludur.
            </Text>
          </View>
        </ScrollView>

        {/* Zorunlu Şifre Sıfırlama Modalı */}
        <Modal visible={showPasswordReset} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.loginCard, { width: '90%', maxWidth: 450 }]}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="key" size={48} color="#f59e0b" style={{ marginBottom: 8 }} />
                <Text style={[styles.loginTitle, { fontSize: 20 }]}>Zorunlu Şifre Güncelleme</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                  Güvenliğiniz için ilk girişte şifrenizi değiştirmelisiniz.
                </Text>
              </View>

              {resetError ? (
                <View style={[styles.errorAlert, { marginBottom: 12 }]}>
                  <Text style={styles.errorAlertText}>{resetError}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Yeni Şifre</Text>
              <TextInput
                style={styles.input}
                placeholder="Yeni şifrenizi yazın..."
                placeholderTextColor="#475569"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
              <TextInput
                style={styles.input}
                placeholder="Yeni şifrenizi onaylayın..."
                placeholderTextColor="#475569"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity style={[styles.loginBtn, { backgroundColor: '#f59e0b' }]} onPress={handlePasswordReset}>
                <Text style={styles.loginBtnText}>Şifreyi Güncelle ve Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // RENDER APP TABS
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceTitle}>Güncel Durumunuz</Text>
              <Text style={[styles.balanceAmount, { color: myBalance < 0 ? '#ff6b6b' : '#51cf66' }]}>
                {myBalance < 0 ? `Borcunuz: ${Math.abs(myBalance)} ₺` : 'Borcunuz Yoktur'}
              </Text>
              <Text style={styles.balanceDetailText}>(Aidat ve diğer harici borç kalemleri dahildir)</Text>
            </View>

            <Text style={styles.sectionTitle}>{buildingName} - Son Ortak Giderler</Text>
            {myBuildingTransactions.map(t => (
              <View key={t.id} style={styles.listItem}>
                <View style={styles.listIcon}>
                  <Ionicons name="arrow-up-circle" size={28} color="#ff6b6b" />
                </View>
                <View style={styles.listBody}>
                  <Text style={styles.listTitle}>{t.description}</Text>
                  <Text style={styles.listSubtitle}>
                    {t.date ? formatDate(t.date) : '-'}
                  </Text>
                </View>
                <Text style={styles.listAmount}>{t.amount} ₺</Text>
              </View>
            ))}
            {myBuildingTransactions.length === 0 && (
              <View style={styles.listItem}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>Kayıtlı ortak gider bulunmuyor.</Text>
              </View>
            )}
          </ScrollView>
        );
      
      case 'announcements':
        return (
          <ScrollView style={styles.content}>
            {/* DUYURULAR LISTESI */}
            <Text style={styles.sectionTitle}>Yönetim Duyuruları</Text>
            <View style={styles.announcementCard}>
              <Text style={styles.announcementDate}>01 Ocak 2026</Text>
              <Text style={styles.announcementTitle}>Yeni Aidat Dönemi</Text>
              <Text style={styles.announcementText}>2026 yılı itibarıyla B Blok aylık sabit aidat tutarı 1.000 ₺ olarak belirlenmiştir.</Text>
            </View>

            {/* AKTIF ANKETLER (OYLAMA) */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Aktif Oylamalar & Anketler</Text>
            {myBuildingPolls.map(p => {
              const hasVoted = p.votes && p.votes[loggedInResidentId!];
              const userVote = hasVoted ? p.votes[loggedInResidentId!] : null;
              const totalVotes = Object.keys(p.votes || {}).length;

              const optCounts: Record<string, number> = {};
              p.options.forEach(o => { optCounts[o] = 0; });
              Object.values(p.votes || {}).forEach(v => {
                if (optCounts[v] !== undefined) optCounts[v]++;
              });

              return (
                <View key={p.id} style={styles.pollCard}>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, color: 'var(--accent-color)', fontWeight: 'bold' }}>ANKET</Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>Toplam Katılım: {totalVotes}</Text>
                  </View>
                  <Text style={styles.pollQuestion}>{p.question}</Text>
                  
                  {hasVoted ? (
                    // Voted View (Results)
                    <View style={{ marginTop: 12 }}>
                      <Text style={{ fontSize: 12, color: '#51cf66', fontWeight: 'bold', marginBottom: 12 }}>
                        ✓ Oyunuz Kaydedildi (Tercihiniz: {userVote})
                      </Text>
                      {p.options.map(opt => {
                        const count = optCounts[opt] || 0;
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        return (
                          <View key={opt} style={{ marginBottom: 8 }}>
                            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ color: '#cbd5e1', fontSize: 13 }}>{opt}</Text>
                              <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>%{pct} ({count} oy)</Text>
                            </View>
                            <View style={{ width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                              <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 }} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    // Voting Options
                    <View style={{ marginTop: 12 }}>
                      {p.options.map(opt => (
                        <TouchableOpacity 
                          key={opt} 
                          style={styles.pollOptionBtn}
                          onPress={() => handleVote(p.id, opt)}
                        >
                          <Ionicons name="radio-button-off" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                          <Text style={{ color: '#f8fafc', fontSize: 14 }}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
            {myBuildingPolls.length === 0 && (
              <View style={styles.pollCard}>
                <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>Katılabileceğiniz aktif anket bulunmuyor.</Text>
              </View>
            )}
          </ScrollView>
        );

      case 'receipts':
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Fatura & Fiş Arşivi</Text>
            {receipts.map(r => (
              <View key={r.id} style={styles.receiptCard}>
                <Text style={styles.receiptTitle}>{r.title}</Text>
                <Text style={styles.receiptDate}>{r.date}</Text>
                <Image source={{ uri: r.image }} style={styles.receiptImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>
        );

      case 'gas':
        return (
          <ScrollView style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="flame" size={24} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Doğalgaz Belgeleri</Text>
            </View>
            <Text style={{ color: '#94a3b8', marginBottom: 24 }}>Yönetim tarafından yüklenen doğalgaz fatura ve paylaştırma belgelerini (PDF / Excel) buradan indirebilirsiniz.</Text>
            
            {gasDocuments.map((doc) => (
              <TouchableOpacity key={doc.id} style={styles.documentCard}>
                <View style={[styles.documentIcon, { backgroundColor: doc.type === 'excel' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                  <Ionicons name="document-text" size={32} color={doc.type === 'excel' ? '#10b981' : '#ef4444'} />
                </View>
                <View style={styles.documentBody}>
                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  <Text style={styles.documentSubtitle}>{doc.date} • {doc.size}</Text>
                </View>
                <Ionicons name="download-outline" size={24} color="#3b82f6" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'profile':
        // Filter personal transactions
        const personalPayments = transactions.filter(t => 
          t.residentId === loggedInResidentId && t.type === 'income'
        );

        return (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Hesap Kartım & Cari Detayı</Text>
            
            {/* Profil Künyesi */}
            <View style={[styles.balanceCard, { padding: 20, marginBottom: 20 }]}>
              <Ionicons name="person-circle" size={64} color="#10b981" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 }}>
                {currentResident?.name}
              </Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                Daire {currentResident?.aptNo} • {currentResident?.type === 'ev_sahibi' ? 'Ev Sahibi' : 'Kiracı'}
              </Text>
              
              <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>GÜNCEL HESAP BAKİYENİZ</Text>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: myBalance < 0 ? '#ff6b6b' : '#10b981' }}>
                  {myBalance < 0 ? `${Math.abs(myBalance)} ₺ Borç` : '0 ₺ (Borç Yoktur)'}
                </Text>
              </View>
            </View>

            {/* Daire & İletişim Detayları */}
            <View style={[styles.listItem, { flexDirection: 'column', alignItems: 'stretch', gap: 12, marginBottom: 20 }]}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 8 }}>Kişisel & Daire Bilgileri</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>Bağlı Bina</Text>
                <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '500' }}>{buildingName}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>Daire No</Text>
                <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '500' }}>{currentResident?.aptNo}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>Telefon</Text>
                <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '500' }}>{currentResident?.phone}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>Aylık Sabit Aidat</Text>
                <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '500' }}>{currentApt?.duesAmount || 1000} ₺ / Ay</Text>
              </View>
            </View>

            {/* ARIZA & TALEP BILDIRIMLERIM */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0, fontSize: 16 }]}>Arıza & Talep Kayıtlarım</Text>
              <TouchableOpacity 
                style={styles.smallAddBtn}
                onPress={() => setIsTicketModalOpen(true)}
              >
                <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: 'bold' }}>+ Yeni Bildirim Aç</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
              {myBuildingTickets.filter(t => t.residentId === loggedInResidentId).map(t => (
                <View key={t.id} style={[styles.listItem, { flexDirection: 'column', alignItems: 'stretch', gap: 6 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: 14 }}>{t.title}</Text>
                    <Text style={[
                      styles.ticketStatusText, 
                      { color: t.status === 'Çözüldü' ? '#51cf66' : t.status === 'İşlemde' ? '#f59e0b' : '#ff6b6b' }
                    ]}>
                      {t.status}
                    </Text>
                  </View>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>{t.description}</Text>
                  {t.resolutionNotes ? (
                    <View style={{ marginTop: 4, padding: 6, backgroundColor: '#334155', borderRadius: 4 }}>
                      <Text style={{ color: '#cbd5e1', fontSize: 11 }}><strong>Çözüm Notu:</strong> {t.resolutionNotes}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
              {myBuildingTickets.filter(t => t.residentId === loggedInResidentId).length === 0 && (
                <View style={styles.listItem}>
                  <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', width: '100%' }}>Kayıtlı arıza bildiriminiz bulunmamaktadır.</Text>
                </View>
              )}
            </View>

            {/* Cari Hesap Geçmişi */}
            <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 12 }]}>Hesap Ekstresi (Kişisel Cari Ödemeler)</Text>
            <View style={{ marginBottom: 20 }}>
              {personalPayments.map(item => (
                <View key={item.id} style={[styles.listItem, { paddingVertical: 12, marginBottom: 8 }]}>
                  <View style={styles.listIcon}>
                    <Ionicons name="arrow-down-circle" size={24} color="#10b981" />
                  </View>
                  <View style={styles.listBody}>
                    <Text style={[styles.listTitle, { fontSize: 14 }]}>{item.description}</Text>
                    <Text style={styles.listSubtitle}>
                      {item.date ? formatDate(item.date) : '-'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#10b981' }}>
                    +{item.amount} ₺
                  </Text>
                </View>
              ))}
              {personalPayments.length === 0 && (
                <View style={styles.listItem}>
                  <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', width: '100%' }}>Ödeme hareketiniz bulunmuyor.</Text>
                </View>
              )}
            </View>

            {/* Şifre Değiştir & Çıkış Butonları */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
              <TouchableOpacity 
                style={[styles.loginBtn, { flex: 1, backgroundColor: '#475569', marginTop: 0 }]}
                onPress={() => setShowPasswordReset(true)}
              >
                <Text style={styles.loginBtnText}>Şifre Değiştir</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.loginBtn, { flex: 1, backgroundColor: '#ff6b6b', marginTop: 0 }]}
                onPress={handleLogout}
              >
                <Text style={styles.loginBtnText}>Oturumu Kapat</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={() => setActiveTab('profile')}>
        <View>
          <Text style={styles.headerSubtitle}>{buildingName}</Text>
          <Text style={styles.headerTitle}>
            Daire {currentResident?.aptNo} - {currentResident?.name} ({currentResident?.type === 'ev_sahibi' ? 'Ev Sahibi' : 'Kiracı'})
          </Text>
        </View>
        <Ionicons name="person-circle-outline" size={36} color={activeTab === 'profile' ? '#10b981' : '#fff'} />
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.main}>
        {renderContent()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <Ionicons name={activeTab === 'home' ? 'home' : 'home-outline'} size={24} color={activeTab === 'home' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>Ana Sayfa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('gas')}>
          <Ionicons name={activeTab === 'gas' ? 'flame' : 'flame-outline'} size={24} color={activeTab === 'gas' ? '#f59e0b' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'gas' && {color: '#f59e0b'}]}>Doğalgaz</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('receipts')}>
          <Ionicons name={activeTab === 'receipts' ? 'document-text' : 'document-text-outline'} size={24} color={activeTab === 'receipts' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'receipts' && styles.tabTextActive]}>Faturalar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('announcements')}>
          <Ionicons name={activeTab === 'announcements' ? 'megaphone' : 'megaphone-outline'} size={24} color={activeTab === 'announcements' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'announcements' && styles.tabTextActive]}>Duyurular</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
          <Ionicons name={activeTab === 'profile' ? 'person-circle' : 'person-circle-outline'} size={24} color={activeTab === 'profile' ? '#10b981' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'profile' && { color: '#10b981' }]}>Hesabım</Text>
        </TouchableOpacity>
      </View>

      {/* Yeni Arıza Bildirimi Oluşturma Modalı */}
      <Modal visible={isTicketModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.loginCard, { width: '90%', maxWidth: 450 }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#f8fafc' }}>Yeni Arıza / Talep Bildirimi</Text>
              <TouchableOpacity onPress={() => setIsTicketModalOpen(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Arıza Konusu</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 3. Kat koridor lambası yanmıyor"
              placeholderTextColor="#475569"
              value={ticketTitle}
              onChangeText={setTicketTitle}
            />

            <Text style={styles.label}>Detaylı Açıklama</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Arızayı detaylıca açıklayınız..."
              placeholderTextColor="#475569"
              multiline
              value={ticketDesc}
              onChangeText={setTicketDesc}
            />

            <Text style={styles.label}>Öncelik Derecesi</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {(['Düşük', 'Orta', 'Yüksek'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityBtn,
                    ticketPriority === p && { backgroundColor: p === 'Yüksek' ? '#ef4444' : p === 'Orta' ? '#f59e0b' : '#3b82f6' }
                  ]}
                  onPress={() => setTicketPriority(p)}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleCreateTicket}>
              <Text style={styles.loginBtnText}>Bildirimi Gönder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Şifre Değiştirme Modalı (Profil için) */}
      <Modal visible={showPasswordReset} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.loginCard, { width: '90%', maxWidth: 450 }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#f8fafc' }}>Şifre Güncelleme</Text>
              <TouchableOpacity onPress={() => { setShowPasswordReset(false); setNewPassword(''); setConfirmPassword(''); setResetError(''); }}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {resetError ? (
              <View style={[styles.errorAlert, { marginBottom: 12 }]}>
                <Text style={styles.errorAlertText}>{resetError}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Yeni Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="Yeni şifrenizi yazın..."
              placeholderTextColor="#475569"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
            <TextInput
              style={styles.input}
              placeholder="Yeni şifrenizi onaylayın..."
              placeholderTextColor="#475569"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.loginBtn} onPress={handlePasswordReset}>
              <Text style={styles.loginBtnText}>Şifreyi Güncelle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  main: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceDetailText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  listIcon: {
    marginRight: 12,
  },
  listBody: {
    flex: 1,
  },
  listTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '500',
  },
  listSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  listAmount: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  announcementCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  announcementDate: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  announcementTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  announcementText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  pollCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pollQuestion: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pollOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  receiptCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  receiptTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 4,
  },
  receiptDate: {
    color: '#94a3b8',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  receiptImage: {
    width: '100%',
    height: 300,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  documentBody: {
    flex: 1,
  },
  documentTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  // LOGIN SCREEN STYLES
  loginContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
  },
  loginScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  selectContainer: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
    height: 48,
    justifyContent: 'center',
  },
  webSelect: {
    backgroundColor: 'transparent',
    color: '#f8fafc',
    fontSize: 14,
    paddingHorizontal: 12,
    borderWidth: 0,
    width: '100%',
    height: '100%',
    outline: 'none' as any,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#f8fafc',
    fontSize: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  loginBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorAlertText: {
    color: '#ff6b6b',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 12,
  },
  priorityBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#334155',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAddBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  ticketStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  }
});
