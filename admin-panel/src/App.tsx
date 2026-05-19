import { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Users, 
  Bell,
  Plus,
  X,
  FileText,
  Building,
  CreditCard,
  Edit2,
  Briefcase,
  Wallet,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'dashboard' | 'income' | 'expense' | 'residents' | 'announcements' | 'buildings' | 'personnel' | 'other_expenses';

interface Apartment {
  id: string;
  name: string;
  duesDay: number;
  duesAmount: number;
}

interface Transaction {
  id: string;
  apartmentId?: string;
  type: 'income' | 'expense' | 'personnel_expense' | 'other_expense';
  amount: number;
  description: string;
  date: Date;
  residentId?: string;
  receiptUrl?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
}

interface Resident {
  id: string;
  apartmentId: string;
  name: string;
  aptNo: string;
  phone: string;
  balance: number;
  type: 'kiraci' | 'ev_sahibi';
}

const INITIAL_APARTMENTS: Apartment[] = [
  { id: 'apt_1', name: 'Güneş Apartmanı', duesDay: 15, duesAmount: 500 },
  { id: 'apt_2', name: 'Yıldız Sitesi A Blok', duesDay: 5, duesAmount: 750 },
];

const INITIAL_RESIDENTS: Resident[] = [
  { id: '1', apartmentId: 'apt_1', name: 'Ahmet Yılmaz', aptNo: '1', phone: '05551234567', balance: 0, type: 'kiraci' },
  { id: '1_owner', apartmentId: 'apt_1', name: 'Kemal Sunal', aptNo: '1', phone: '05301234567', balance: 0, type: 'ev_sahibi' },
  { id: '2', apartmentId: 'apt_1', name: 'Ayşe Kaya', aptNo: '2', phone: '05321234567', balance: -500, type: 'ev_sahibi' },
  { id: '3', apartmentId: 'apt_2', name: 'Mehmet Demir', aptNo: '1', phone: '05441234567', balance: 0, type: 'ev_sahibi' },
  { id: '4', apartmentId: 'apt_2', name: 'Fatma Çelik', aptNo: '2', phone: '05331234567', balance: -200, type: 'kiraci' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', apartmentId: 'apt_1', type: 'income', amount: 500, description: 'Aidat Ödemesi (Daire 1)', date: new Date('2026-05-01') },
  { id: 't2', apartmentId: 'apt_1', type: 'expense', amount: 1200, description: 'Asansör Bakımı', date: new Date('2026-05-05') },
  { id: 't3', type: 'personnel_expense', amount: 17000, description: 'Hasan Usta Maaş', date: new Date('2026-05-01') },
  { id: 't4', type: 'other_expense', amount: 500, description: 'Yazılım Lisans', date: new Date('2026-05-02') },
];

const INITIAL_STAFFS: Staff[] = [
  { id: 's1', name: 'Hasan Usta', role: 'Kapıcı', phone: '05559998877', salary: 17000 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  
  const [apartments, setApartments] = useState<Apartment[]>(INITIAL_APARTMENTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [residents, setResidents] = useState<Resident[]>(INITIAL_RESIDENTS);
  const [staffs, setStaffs] = useState<Staff[]>(INITIAL_STAFFS);
  
  // Modals
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isOtherExpenseModalOpen, setIsOtherExpenseModalOpen] = useState(false);
  const [isPersonnelExpenseModalOpen, setIsPersonnelExpenseModalOpen] = useState(false);
  
  // Editing state
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffSalary, setStaffSalary] = useState('');

  // Building Form
  const [bName, setBName] = useState('');
  const [bDuesDay, setBDuesDay] = useState('');
  const [bDuesAmount, setBDuesAmount] = useState('');

  // Income / Expense Forms
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Resident Form
  const [resName, setResName] = useState('');
  const [resAptNo, setResAptNo] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resType, setResType] = useState<'kiraci'|'ev_sahibi'>('kiraci');
  const [resAptId, setResAptId] = useState(apartments[0]?.id || '');

  // Debt Form
  const [debtType, setDebtType] = useState<'aidat_kiraci' | 'demirbas_evsahibi'>('aidat_kiraci');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDesc, setDebtDesc] = useState('');
  const [targetResident, setTargetResident] = useState<string>('all'); 

  // Notification Forms
  const [sendPush, setSendPush] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);

  const filteredTransactions = selectedAptId 
    ? transactions.filter(t => t.apartmentId === selectedAptId)
    : [];

  const filteredResidents = selectedAptId
    ? residents.filter(r => r.apartmentId === selectedAptId)
    : [];

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleAddBuilding = () => {
    if (!bName || !bDuesDay || !bDuesAmount) return;
    const newApt: Apartment = {
      id: Math.random().toString(),
      name: bName,
      duesDay: parseInt(bDuesDay),
      duesAmount: parseFloat(bDuesAmount)
    };
    setApartments([...apartments, newApt]);
    setBName(''); setBDuesDay(''); setBDuesAmount('');
    setIsBuildingModalOpen(false);
  };

  const handleSaveTransaction = (type: 'income' | 'expense' | 'personnel_expense' | 'other_expense') => {
    if (!amount || !description) return;
    
    if (editingTransactionId) {
      setTransactions(transactions.map(t => t.id === editingTransactionId ? {
        ...t, description, amount: parseFloat(amount)
      } : t));
    } else {
      const newTransaction: Transaction = {
        id: Math.random().toString(),
        apartmentId: (type === 'income' || type === 'expense') ? (selectedAptId || apartments[0].id) : undefined,
        type,
        amount: parseFloat(amount),
        description,
        date: new Date()
      };
      setTransactions([newTransaction, ...transactions]);
    }
    setAmount(''); setDescription('');
    setEditingTransactionId(null);
    setIsIncomeModalOpen(false); setIsExpenseModalOpen(false);
    setIsOtherExpenseModalOpen(false); setIsPersonnelExpenseModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const openTransactionModal = (type: 'personnel_expense' | 'other_expense', transaction?: Transaction) => {
    if (transaction) {
      setEditingTransactionId(transaction.id);
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
    } else {
      setEditingTransactionId(null);
      setDescription('');
      setAmount('');
    }
    if (type === 'personnel_expense') setIsPersonnelExpenseModalOpen(true);
    if (type === 'other_expense') setIsOtherExpenseModalOpen(true);
  };

  const openStaffModal = (staff?: Staff) => {
    if (staff) {
      setEditingStaffId(staff.id);
      setStaffName(staff.name);
      setStaffRole(staff.role);
      setStaffPhone(staff.phone);
      setStaffSalary(staff.salary.toString());
    } else {
      setEditingStaffId(null);
      setStaffName('');
      setStaffRole('');
      setStaffPhone('');
      setStaffSalary('');
    }
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = () => {
    if (!staffName || !staffRole) return;
    if (editingStaffId) {
      setStaffs(staffs.map(s => s.id === editingStaffId ? {
        ...s, name: staffName, role: staffRole, phone: staffPhone, salary: parseFloat(staffSalary) || 0
      } : s));
    } else {
      const newStaff: Staff = {
        id: Math.random().toString(),
        name: staffName,
        role: staffRole,
        phone: staffPhone,
        salary: parseFloat(staffSalary) || 0
      };
      setStaffs([...staffs, newStaff]);
    }
    setStaffName(''); setStaffRole(''); setStaffPhone(''); setStaffSalary('');
    setIsStaffModalOpen(false);
  };

  const handleDeleteStaff = (id: string) => {
    if (window.confirm("Bu personeli silmek istediğinize emin misiniz?")) {
      setStaffs(staffs.filter(s => s.id !== id));
    }
  };

  const openResidentModal = (resident?: Resident) => {
    if (resident) {
      setEditingResidentId(resident.id);
      setResName(resident.name);
      setResAptNo(resident.aptNo);
      setResPhone(resident.phone);
      setResType(resident.type);
      setResAptId(resident.apartmentId);
    } else {
      setEditingResidentId(null);
      setResName('');
      setResAptNo('');
      setResPhone('');
      setResType('kiraci');
      setResAptId(selectedAptId || apartments[0].id);
    }
    setIsResidentModalOpen(true);
  };

  const handleSaveResident = () => {
    if(!resName || !resAptNo || !resPhone) return;
    
    if (editingResidentId) {
      setResidents(residents.map(r => r.id === editingResidentId ? {
        ...r,
        name: resName, aptNo: resAptNo, phone: resPhone, type: resType, apartmentId: resAptId
      } : r));
    } else {
      const newResident: Resident = {
        id: Math.random().toString(),
        apartmentId: resAptId,
        name: resName,
        aptNo: resAptNo,
        phone: resPhone,
        balance: 0,
        type: resType
      };
      setResidents([...residents, newResident]);
    }
    setIsResidentModalOpen(false);
  };

  const handleAddDebt = () => {
    if (!selectedAptId) {
      alert("Borçlandırma yapmak için önce spesifik bir bina seçmelisiniz.");
      return;
    }

    const currentApt = apartments.find(a => a.id === selectedAptId);
    if (!currentApt) return;

    let finalAmount = parseFloat(debtAmount);

    if (debtType === 'aidat_kiraci') {
      finalAmount = debtAmount !== '' ? parseFloat(debtAmount) : currentApt.duesAmount;
    } else {
      if (!debtAmount || !debtDesc) return;
    }

    // Mantık: Eğer bir dairede KİRACI varsa aidat ona, demirbaş EV SAHİBİNE yazılır.
    // Eğer sadece EV SAHİBİ varsa (kendisi oturuyorsa) her şey ona yazılır.
    const residentsInApt = residents.filter(r => r.apartmentId === selectedAptId);
    
    const newResidents = residents.map(r => {
      if (r.apartmentId === selectedAptId) {
        if (targetResident === 'all' || r.id === targetResident) {
          
          const occupantsInSameAptNo = residentsInApt.filter(x => x.aptNo === r.aptNo);
          const hasTenant = occupantsInSameAptNo.some(x => x.type === 'kiraci');
          
          let shouldApplyDebt = false;

          if (debtType === 'aidat_kiraci') {
            if (r.type === 'kiraci') shouldApplyDebt = true;
            if (r.type === 'ev_sahibi' && !hasTenant) shouldApplyDebt = true; // Kendi oturuyorsa aidatı ev sahibi öder
          } else if (debtType === 'demirbas_evsahibi') {
            if (r.type === 'ev_sahibi') shouldApplyDebt = true;
          }

          if (shouldApplyDebt) {
            return { ...r, balance: r.balance - finalAmount };
          }
        }
      }
      return r;
    });

    setResidents(newResidents);
    setDebtAmount(''); setDebtDesc('');
    setIsDebtModalOpen(false);
    alert('Borçlandırma başarıyla uygulandı.');
  };

  const getAptName = (id: string) => apartments.find(a => a.id === id)?.name || '';

  const renderBuildingSelection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', minHeight: '80vh' }}>
      <h1 style={{ marginBottom: '16px', fontSize: '32px', fontWeight: 600 }}>Hoş Geldiniz</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>İşlem yapmak istediğiniz binayı seçin.</p>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '800px' }}>
        {apartments.map(apt => (
          <div 
            key={apt.id} 
            className="glass-panel" 
            style={{ 
              padding: '32px', 
              cursor: 'pointer', 
              minWidth: '250px', 
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            onClick={() => { setSelectedAptId(apt.id); setActiveTab('dashboard'); }}
          >
            <Building size={48} style={{ margin: '0 auto 16px auto', color: 'var(--accent-color)' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{apt.name}</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Aidat: ₺{apt.duesAmount}</div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '48px' }}>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsBuildingModalOpen(true)}>
          <Plus size={18} /> Yeni Bina Ekle
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Genel Durum - {selectedAptId ? getAptName(selectedAptId) : ''}</h2>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel stat-card income">
          <h3>Toplam Gelir</h3>
          <div className="value">₺{totalIncome.toLocaleString()}</div>
        </div>
        <div className="glass-panel stat-card expense">
          <h3>Toplam Gider</h3>
          <div className="value">₺{totalExpense.toLocaleString()}</div>
        </div>
        <div className="glass-panel stat-card balance">
          <h3>Kasa Bakiyesi</h3>
          <div className="value">₺{balance.toLocaleString()}</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Son İşlemler</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th>Tür</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 5).map(t => (
                <tr key={t.id}>
                  <td>{format(t.date, 'dd MMM yyyy')}</td>
                  <td>{t.description}</td>
                  <td>
                    <span style={{ 
                      color: t.type === 'income' ? 'var(--success-color)' : 'var(--danger-color)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                    }}>
                      {t.type === 'income' ? 'Gelir' : 'Gider'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>₺{t.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar glass-panel" style={{ border: 'none', borderRight: '1px solid var(--border-card)', borderRadius: 0 }}>
        <div className="sidebar-header">Yönetim Paneli</div>

        {selectedAptId ? (
          <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aktif Bina</div>
            <div style={{ color: 'var(--accent-color)', fontWeight: 600, fontSize: '16px', marginBottom: '16px' }}>{getAptName(selectedAptId)}</div>
            <button className="btn-secondary" style={{ width: '100%', fontSize: '13px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => { setSelectedAptId(null); setActiveTab('dashboard'); }}>
              <Building size={16} />
              Bina Değiştir
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>İşlem yapmak için<br/>bina seçiniz</div>
            {(activeTab === 'personnel' || activeTab === 'other_expenses') && (
               <button className="btn-secondary" style={{ width: '100%', fontSize: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => setActiveTab('dashboard')}>
                 <Building size={14} /> Bina Seçimine Dön
               </button>
            )}
          </div>
        )}
        
        {selectedAptId && (
          <>
            <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>
            <button className={`nav-item ${activeTab === 'income' ? 'active' : ''}`} onClick={() => setActiveTab('income')}>
              <ArrowDownToLine size={20} />
              <span>Gelirler</span>
            </button>
            <button className={`nav-item ${activeTab === 'expense' ? 'active' : ''}`} onClick={() => setActiveTab('expense')}>
              <ArrowUpFromLine size={20} />
              <span>Giderler & Faturalar</span>
            </button>
            <button className={`nav-item ${activeTab === 'residents' ? 'active' : ''}`} onClick={() => setActiveTab('residents')}>
              <Users size={20} />
              <span>Sakinler & Borçlandırma</span>
            </button>
            <button className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
              <Bell size={20} />
              <span>Duyurular</span>
            </button>
            <div style={{ margin: '16px 0', borderBottom: '1px solid var(--border-card)' }}></div>
          </>
        )}

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', paddingLeft: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Genel Yönetim</div>
        <button className={`nav-item ${activeTab === 'personnel' ? 'active' : ''}`} onClick={() => setActiveTab('personnel')}>
          <Briefcase size={20} />
          <span>Personeller</span>
        </button>
        <button className={`nav-item ${activeTab === 'other_expenses' ? 'active' : ''}`} onClick={() => setActiveTab('other_expenses')}>
          <Wallet size={20} />
          <span>Diğer Giderler</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {!selectedAptId && activeTab !== 'personnel' && activeTab !== 'other_expenses' && renderBuildingSelection()}
        
        {selectedAptId && activeTab === 'dashboard' && renderDashboard()}

        {/* GELİRLER TAB */}
        {activeTab === 'income' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Gelir Yönetimi</h2>
              <button className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsIncomeModalOpen(true)}>
                <Plus size={18} /> Yeni Gelir Ekle
              </button>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Açıklama</th>
                    <th>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t => t.type === 'income').map(t => (
                    <tr key={t.id}>
                      <td>{format(t.date, 'dd MMM yyyy')}</td>
                      <td>{t.description}</td>
                      <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>₺{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GİDERLER TAB */}
        {activeTab === 'expense' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Gider Yönetimi</h2>
              <button className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsExpenseModalOpen(true)}>
                <Plus size={18} /> Yeni Gider Ekle
              </button>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Açıklama</th>
                    <th>Fatura</th>
                    <th>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t => t.type === 'expense').map(t => (
                    <tr key={t.id}>
                      <td>{format(t.date, 'dd MMM yyyy')}</td>
                      <td>{t.description}</td>
                      <td><button style={{background: 'transparent', color: 'var(--accent-color)'}}><FileText size={18} /></button></td>
                      <td style={{ color: 'var(--danger-color)', fontWeight: 600 }}>₺{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* SAKİNLER TAB */}
        {activeTab === 'residents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
               <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Sakinler & Borçlandırma</h2>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsDebtModalOpen(true)}>
                    <CreditCard size={18} /> Toplu Borçlandırma
                 </button>
                 <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => openResidentModal()}>
                    <Plus size={18} /> Yeni Sakin Ekle
                 </button>
               </div>
            </div>
            
            <div className="glass-panel" style={{ padding: '24px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Daire No</th>
                    <th>İsim Soyisim</th>
                    <th>Kiracı/Ev Sahibi</th>
                    <th>Telefon</th>
                    <th>Bakiye Durumu</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map(r => (
                    <tr key={r.id}>
                      <td>Daire {r.aptNo}</td>
                      <td>{r.name}</td>
                      <td>
                        <span style={{ 
                          fontSize: '12px', padding: '4px 8px', borderRadius: '4px',
                          background: r.type === 'ev_sahibi' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: r.type === 'ev_sahibi' ? 'var(--accent-color)' : 'var(--warning-color)'
                        }}>
                          {r.type === 'ev_sahibi' ? 'Ev Sahibi' : 'Kiracı'}
                        </span>
                      </td>
                      <td>{r.phone}</td>
                      <td>
                        <span style={{ color: r.balance < 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                          {r.balance < 0 ? `Borçlu (₺${Math.abs(r.balance)})` : 'Temiz'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => openResidentModal(r)}
                          style={{ background: 'transparent', color: 'var(--accent-color)' }}
                        >
                          <Edit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DUYURULAR TAB */}
        {activeTab === 'announcements' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Duyurular</h2>
            <div className="glass-panel" style={{ padding: '24px' }}>
               <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Mesaj İçeriği</label>
               <textarea 
                  className="input-field" 
                  rows={4} 
                  placeholder="Sakinlere gönderilecek duyuruyu yazın..."
               ></textarea>
               
               <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', marginTop: '12px' }}>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                   <input type="checkbox" checked={sendPush} onChange={(e) => setSendPush(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                   <span>Mobil Uygulama (Push Bildirimi)</span>
                 </label>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                   <input type="checkbox" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                   <span>WhatsApp Mesajı</span>
                 </label>
               </div>

               <button className="btn-primary">Duyuru Gönder</button>
            </div>
          </div>
        )}

        {/* PERSONEL TAB */}
        {activeTab === 'personnel' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Personel Yönetimi</h2>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => openStaffModal()}>
                <Plus size={18} /> Yeni Personel Ekle
              </button>
            </div>
            
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Personel Listesi</h3>
              <table>
                <thead>
                  <tr>
                    <th>İsim Soyisim</th>
                    <th>Görev</th>
                    <th>Telefon</th>
                    <th>Maaş</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {staffs.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td><span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '13px' }}>{s.role}</span></td>
                      <td>{s.phone}</td>
                      <td>₺{s.salary.toLocaleString()}</td>
                      <td>
                        <button onClick={() => openStaffModal(s)} style={{ background: 'transparent', color: 'var(--accent-color)', marginRight: '8px' }}><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteStaff(s.id)} style={{ background: 'transparent', color: 'var(--danger-color)' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {staffs.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Kayıtlı personel bulunmuyor.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 600 }}>Personel Giderleri</h3>
              <button className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => openTransactionModal('personnel_expense')}>
                <Plus size={18} /> Gider Ekle
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Açıklama</th>
                    <th>Tutar</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.filter(t => t.type === 'personnel_expense').map(t => (
                    <tr key={t.id}>
                      <td>{format(t.date, 'dd MMM yyyy')}</td>
                      <td>{t.description}</td>
                      <td style={{ color: 'var(--danger-color)', fontWeight: 600 }}>₺{t.amount.toLocaleString()}</td>
                      <td>
                        <button onClick={() => openTransactionModal('personnel_expense', t)} style={{ background: 'transparent', color: 'var(--accent-color)', marginRight: '8px' }}><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteTransaction(t.id)} style={{ background: 'transparent', color: 'var(--danger-color)' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DİĞER GİDERLER TAB */}
        {activeTab === 'other_expenses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Diğer Giderler (Genel)</h2>
              <button className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => openTransactionModal('other_expense')}>
                <Plus size={18} /> Yeni Gider Ekle
              </button>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Bu bölümde binalarla bağlantısı olmayan, yönetim firmasına ait genel giderler (yazılım, ofis, vb.) takip edilir.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Açıklama</th>
                    <th>Tutar</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.filter(t => t.type === 'other_expense').map(t => (
                    <tr key={t.id}>
                      <td>{format(t.date, 'dd MMM yyyy')}</td>
                      <td>{t.description}</td>
                      <td style={{ color: 'var(--danger-color)', fontWeight: 600 }}>₺{t.amount.toLocaleString()}</td>
                      <td>
                        <button onClick={() => openTransactionModal('other_expense', t)} style={{ background: 'transparent', color: 'var(--accent-color)', marginRight: '8px' }}><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteTransaction(t.id)} style={{ background: 'transparent', color: 'var(--danger-color)' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Building Modal */}
      {isBuildingModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>Yeni Bina Ekle</h3>
              <button className="close-btn" onClick={() => setIsBuildingModalOpen(false)}><X size={24} /></button>
            </div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Bina Adı (Örn: Çiçek Apartmanı)" 
              value={bName}
              onChange={(e) => setBName(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '16px' }}>
              <input 
                type="number" 
                className="input-field" 
                placeholder="Aidat Günü (Örn: 15)" 
                value={bDuesDay}
                onChange={(e) => setBDuesDay(e.target.value)}
              />
              <input 
                type="number" 
                className="input-field" 
                placeholder="Standart Aidat Tutarı (₺)" 
                value={bDuesAmount}
                onChange={(e) => setBDuesAmount(e.target.value)}
              />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleAddBuilding}>
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Income Modal */}
      {isIncomeModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>Yeni Gelir Ekle</h3>
              <button className="close-btn" onClick={() => setIsIncomeModalOpen(false)}><X size={24} /></button>
            </div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Açıklama (Örn: Daire 4 Aidat)" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input 
              type="number" 
              className="input-field" 
              placeholder="Tutar (₺)" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button className="btn-success" style={{ width: '100%' }} onClick={() => handleSaveTransaction('income')}>
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>Yeni Gider/Fatura Ekle</h3>
              <button className="close-btn" onClick={() => setIsExpenseModalOpen(false)}><X size={24} /></button>
            </div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Açıklama (Örn: Su Faturası)" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input 
              type="number" 
              className="input-field" 
              placeholder="Tutar (₺)" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Fatura Görseli Yükle</label>
              <input type="file" style={{ color: 'var(--text-primary)' }} />
            </div>
            <button className="btn-danger" style={{ width: '100%' }} onClick={() => handleSaveTransaction('expense')}>
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Debt Modal */}
      {isDebtModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>Borçlandırma İşlemi</h3>
              <button className="close-btn" onClick={() => setIsDebtModalOpen(false)}><X size={24} /></button>
            </div>
            
            {!selectedAptId ? (
              <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>
                Lütfen borçlandırma yapmadan önce bir bina seçiniz.
              </p>
            ) : (
              <>
                <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', border: debtType === 'aidat_kiraci' ? '1px solid var(--accent-color)' : '1px solid transparent' }}>
                    <input type="radio" checked={debtType === 'aidat_kiraci'} onChange={() => setDebtType('aidat_kiraci')} /> 
                    <div>
                      <strong>Otomatik Aidat Yansıt</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Öncelikli olarak Kiracıya, kiracı yoksa Ev Sahibine yazılır.</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', border: debtType === 'demirbas_evsahibi' ? '1px solid var(--accent-color)' : '1px solid transparent' }}>
                    <input type="radio" checked={debtType === 'demirbas_evsahibi'} onChange={() => setDebtType('demirbas_evsahibi')} /> 
                    <div>
                      <strong>Demirbaş / Ekstra Borç Yansıt</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sadece Ev Sahiplerine yansıtılır (Örn: Çatı tamiri, asansör motoru).</div>
                    </div>
                  </label>
                </div>

                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Kime Uygulanacak?</label>
                <select className="input-field" value={targetResident} onChange={(e) => setTargetResident(e.target.value)}>
                  <option value="all">Seçilen Kalemdeki Herkese Uygula (Tüm Bina)</option>
                  {filteredResidents.map(r => (
                    <option key={r.id} value={r.id}>Sadece {r.name} (Daire {r.aptNo})</option>
                  ))}
                </select>

                {debtType === 'demirbas_evsahibi' && (
                  <>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Borç Kalemi (Örn: Çatı Tamiri)" 
                      value={debtDesc}
                      onChange={(e) => setDebtDesc(e.target.value)}
                    />
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="Tutar (₺)" 
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                    />
                  </>
                )}

                {debtType === 'aidat_kiraci' && (
                  <>
                    <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }}>
                      Seçili Bina: <strong>{getAptName(selectedAptId)}</strong>
                    </div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Yansıtılacak Aidat Tutarı (Standart: ₺{apartments.find(a => a.id === selectedAptId)?.duesAmount})
                    </label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="Tutarı değiştirin veya boş bırakın"
                      defaultValue={apartments.find(a => a.id === selectedAptId)?.duesAmount || ''}
                      onChange={(e) => setDebtAmount(e.target.value)}
                    />
                  </>
                )}
                
                <button className="btn-danger" style={{ width: '100%' }} onClick={handleAddDebt}>
                  Borçlandır
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Resident Modal */}
      {isResidentModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>{editingResidentId ? 'Sakini Düzenle' : 'Yeni Sakin Ekle'}</h3>
              <button className="close-btn" onClick={() => setIsResidentModalOpen(false)}><X size={24} /></button>
            </div>
            
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Bağlı Olduğu Bina</label>
            <select 
               className="input-field" 
               style={{ appearance: 'menulist' }}
               value={resAptId}
               onChange={(e) => setResAptId(e.target.value)}
            >
               {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>

            <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="radio" checked={resType === 'kiraci'} onChange={() => setResType('kiraci')} /> Kiracı
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="radio" checked={resType === 'ev_sahibi'} onChange={() => setResType('ev_sahibi')} /> Ev Sahibi
              </label>
            </div>

            <input 
              type="text" 
              className="input-field" 
              placeholder="İsim Soyisim" 
              value={resName}
              onChange={(e) => setResName(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '16px' }}>
               <input 
                 type="text" 
                 className="input-field" 
                 placeholder="Daire No" 
                 value={resAptNo}
                 onChange={(e) => setResAptNo(e.target.value)}
               />
               <input 
                 type="text" 
                 className="input-field" 
                 placeholder="Telefon No" 
                 value={resPhone}
                 onChange={(e) => setResPhone(e.target.value)}
               />
            </div>
            
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleSaveResident}>
              {editingResidentId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {isStaffModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>{editingStaffId ? 'Personeli Düzenle' : 'Yeni Personel Ekle'}</h3>
              <button className="close-btn" onClick={() => setIsStaffModalOpen(false)}><X size={24} /></button>
            </div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="İsim Soyisim" 
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
            />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Görev (Örn: Kapıcı, Güvenlik)" 
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value)}
            />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Telefon No" 
              value={staffPhone}
              onChange={(e) => setStaffPhone(e.target.value)}
            />
            <input 
              type="number" 
              className="input-field" 
              placeholder="Maaş (₺)" 
              value={staffSalary}
              onChange={(e) => setStaffSalary(e.target.value)}
            />
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleSaveStaff}>
              {editingStaffId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* Personnel Expense Modal */}
      {isPersonnelExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>{editingTransactionId ? 'Gideri Düzenle' : 'Personel Gideri Ekle'}</h3>
              <button className="close-btn" onClick={() => { setIsPersonnelExpenseModalOpen(false); setEditingTransactionId(null); }}><X size={24} /></button>
            </div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Açıklama (Örn: Hasan Usta Mayıs Maaşı)" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input 
              type="number" 
              className="input-field" 
              placeholder="Tutar (₺)" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button className="btn-danger" style={{ width: '100%' }} onClick={() => handleSaveTransaction('personnel_expense')}>
              {editingTransactionId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* Other Expense Modal */}
      {isOtherExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>{editingTransactionId ? 'Gideri Düzenle' : 'Diğer Gider Ekle'}</h3>
              <button className="close-btn" onClick={() => { setIsOtherExpenseModalOpen(false); setEditingTransactionId(null); }}><X size={24} /></button>
            </div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Açıklama (Örn: Kırtasiye, Yazılım Lisansı)" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input 
              type="number" 
              className="input-field" 
              placeholder="Tutar (₺)" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button className="btn-danger" style={{ width: '100%' }} onClick={() => handleSaveTransaction('other_expense')}>
              {editingTransactionId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
