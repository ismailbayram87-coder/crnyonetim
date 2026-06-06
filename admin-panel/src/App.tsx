import { useState, useEffect } from 'react';
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
  Trash2,
  Printer,
  Download,
  Upload,
  Activity,
  Grid,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'dashboard' | 'income' | 'expense' | 'residents' | 'announcements' | 'buildings' | 'personnel' | 'other_expenses' | 'ledgers' | 'import' | 'sheet' | 'tickets';

interface Apartment {
  id: string;
  name: string;
  duesDay: number;
  duesAmount: number;
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

interface Transaction {
  id: string;
  apartmentId?: string;
  type: 'income' | 'expense' | 'personnel_expense' | 'other_expense';
  amount: number;
  description: string;
  date: Date;
  residentId?: string;
  receiptUrl?: string;
  staffId?: string; // Hangi personele ödeme yapıldı
}

interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
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
}

interface StaffJob {
  id: string;
  staffId: string;
  buildingId: string;
  jobType: string; // Çöp toplama, Temizlik vb.
  description: string;
  amount: number;
  date: Date;
}

interface PredefinedJob {
  id: string;
  name: string;
  defaultAmount: number;
}

const INITIAL_APARTMENTS: Apartment[] = [
  { id: 'apt_elitkent_b', name: 'Elitkent Sitesi B Blok', duesDay: 15, duesAmount: 1000 }
];

const INITIAL_RESIDENTS: Resident[] = [
  {
    "id": "1",
    "apartmentId": "apt_1",
    "name": "Ahmet Yılmaz",
    "aptNo": "1",
    "phone": "05551234567",
    "balance": 0,
    "type": "kiraci",
    "dues": 500,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 0,
    "paidAmount": 0,
    "paymentChannel": "",
    "paymentDate": ""
  },
  {
    "id": "1_owner",
    "apartmentId": "apt_1",
    "name": "Kemal Sunal",
    "aptNo": "1",
    "phone": "05301234567",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 500,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 0,
    "paidAmount": 0,
    "paymentChannel": "",
    "paymentDate": ""
  },
  {
    "id": "2",
    "apartmentId": "apt_1",
    "name": "Ayşe Kaya",
    "aptNo": "2",
    "phone": "05321234567",
    "balance": -500,
    "type": "ev_sahibi",
    "dues": 500,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 0,
    "paidAmount": 0,
    "paymentChannel": "",
    "paymentDate": ""
  },
  {
    "id": "3",
    "apartmentId": "apt_2",
    "name": "Mehmet Demir",
    "aptNo": "1",
    "phone": "05441234567",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 750,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 0,
    "paidAmount": 0,
    "paymentChannel": "",
    "paymentDate": ""
  },
  {
    "id": "4",
    "apartmentId": "apt_2",
    "name": "Fatma Çelik",
    "aptNo": "2",
    "phone": "05331234567",
    "balance": -200,
    "type": "kiraci",
    "dues": 750,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 0,
    "paidAmount": 0,
    "paymentChannel": "",
    "paymentDate": ""
  },
  {
    "id": "elitkent_1",
    "apartmentId": "apt_elitkent_b",
    "name": "Recep AVALI",
    "aptNo": "1",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 4110.54,
    "paidAmount": 5110.54,
    "paymentChannel": "BANKA",
    "paymentDate": "19-23.01.2026"
  },
  {
    "id": "elitkent_2",
    "apartmentId": "apt_elitkent_b",
    "name": "Recep BEKE",
    "aptNo": "2",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 3439,
    "paidAmount": 4439,
    "paymentChannel": "BANKA",
    "paymentDate": "16.01.2026"
  },
  {
    "id": "elitkent_3",
    "apartmentId": "apt_elitkent_b",
    "name": "Mehmet Ali TİRYAKİ",
    "aptNo": "3",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 3109.5,
    "paidAmount": 4109.5,
    "paymentChannel": "GİDER FİŞ 16",
    "paymentDate": "21.12.2025"
  },
  {
    "id": "elitkent_4",
    "apartmentId": "apt_elitkent_b",
    "name": "Cahit UÇAR",
    "aptNo": "4",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 4486.5,
    "paidAmount": 5486.5,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_5",
    "apartmentId": "apt_elitkent_b",
    "name": "Rıdvan HELVACI",
    "aptNo": "5",
    "phone": "Girilmedi",
    "balance": -0.41,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 29.01,
    "gasDelay": 2.9,
    "gasOther": 4803.5,
    "paidAmount": 5835,
    "paymentChannel": "BANKA",
    "paymentDate": "17.01.2026"
  },
  {
    "id": "elitkent_6",
    "apartmentId": "apt_elitkent_b",
    "name": "ReceP UZUN",
    "aptNo": "6",
    "phone": "Girilmedi",
    "balance": -0.59,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -0.41,
    "gasDelay": 0,
    "gasOther": 3501,
    "paidAmount": 4500,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_7",
    "apartmentId": "apt_elitkent_b",
    "name": "Şaban ÇAKIROĞLU",
    "aptNo": "7",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 2036.5,
    "paidAmount": 3036.5,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_8",
    "apartmentId": "apt_elitkent_b",
    "name": "Özer ERCAN",
    "aptNo": "8",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 2102,
    "paidAmount": 3102,
    "paymentChannel": "BANKA",
    "paymentDate": "19.01.2026"
  },
  {
    "id": "elitkent_9",
    "apartmentId": "apt_elitkent_b",
    "name": "Nusret HAYDAROĞLU",
    "aptNo": "9",
    "phone": "Girilmedi",
    "balance": -993.56,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -7.44,
    "gasDelay": 0,
    "gasOther": 3501,
    "paidAmount": 3500,
    "paymentChannel": "BANKA",
    "paymentDate": "19.01.2026"
  },
  {
    "id": "elitkent_10",
    "apartmentId": "apt_elitkent_b",
    "name": "Sinan Bahri BALABAN",
    "aptNo": "10",
    "phone": "Girilmedi",
    "balance": -3.39,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 72.26,
    "gasDelay": 7.23,
    "gasOther": 4222,
    "paidAmount": 5298.1,
    "paymentChannel": "BANKA",
    "paymentDate": "19.01.2026"
  },
  {
    "id": "elitkent_11",
    "apartmentId": "apt_elitkent_b",
    "name": "Tunahan KAPLAN",
    "aptNo": "11",
    "phone": "Girilmedi",
    "balance": -6114.1,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 2888.73,
    "gasDelay": 288.87,
    "gasOther": 2036.5,
    "paidAmount": 100,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_12",
    "apartmentId": "apt_elitkent_b",
    "name": "Erol KIRMACI",
    "aptNo": "12",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 3187.5,
    "paidAmount": 4187.5,
    "paymentChannel": "BANKA",
    "paymentDate": "21.01.2026"
  },
  {
    "id": "elitkent_13",
    "apartmentId": "apt_elitkent_b",
    "name": "Mustafa EMİCİ",
    "aptNo": "13",
    "phone": "Girilmedi",
    "balance": 0.22,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -0.22,
    "gasDelay": 0,
    "gasOther": 2358,
    "paidAmount": 3358,
    "paymentChannel": "BANKA",
    "paymentDate": "14.01.2026"
  },
  {
    "id": "elitkent_14",
    "apartmentId": "apt_elitkent_b",
    "name": "Recep KUŞOĞLU",
    "aptNo": "14",
    "phone": "Girilmedi",
    "balance": 0.39,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -0.39,
    "gasDelay": 0,
    "gasOther": 2358,
    "paidAmount": 3358,
    "paymentChannel": "BANKA",
    "paymentDate": "19.01.2026"
  },
  {
    "id": "elitkent_15",
    "apartmentId": "apt_elitkent_b",
    "name": "Mehmet US",
    "aptNo": "15",
    "phone": "Girilmedi",
    "balance": 17.04,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -39.04,
    "gasDelay": 0,
    "gasOther": 3022,
    "paidAmount": 4000,
    "paymentChannel": "BANKA",
    "paymentDate": "19.01.2026"
  },
  {
    "id": "elitkent_16",
    "apartmentId": "apt_elitkent_b",
    "name": "Bayram ERTEKİN",
    "aptNo": "16",
    "phone": "Girilmedi",
    "balance": 0.19,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0.74,
    "gasDelay": 0.07,
    "gasOther": 2242,
    "paidAmount": 3243,
    "paymentChannel": "BANKA",
    "paymentDate": "24.01.2026"
  },
  {
    "id": "elitkent_17",
    "apartmentId": "apt_elitkent_b",
    "name": "Fazıl KARAMUSAOĞLU",
    "aptNo": "17",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 2858,
    "paidAmount": 3858,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_18",
    "apartmentId": "apt_elitkent_b",
    "name": "Emre AKBIYIK",
    "aptNo": "18",
    "phone": "Girilmedi",
    "balance": 0.07,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -0.57,
    "gasDelay": 0,
    "gasOther": 3892.5,
    "paidAmount": 4892,
    "paymentChannel": "BANKA",
    "paymentDate": "19.01.2026"
  },
  {
    "id": "elitkent_19",
    "apartmentId": "apt_elitkent_b",
    "name": "Cemil METİN",
    "aptNo": "19",
    "phone": "Girilmedi",
    "balance": 4.34,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 889.69,
    "gasDelay": 88.97,
    "gasOther": 3022,
    "paidAmount": 5005,
    "paymentChannel": "BANKA",
    "paymentDate": "17.01.2026"
  },
  {
    "id": "elitkent_20",
    "apartmentId": "apt_elitkent_b",
    "name": "Ömer Faruk DEDEOĞLU",
    "aptNo": "20",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 3988.5,
    "paidAmount": 4988.5,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_21",
    "apartmentId": "apt_elitkent_b",
    "name": "Şaban ŞEN",
    "aptNo": "21",
    "phone": "Girilmedi",
    "balance": 6.75,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -0.75,
    "gasDelay": 0,
    "gasOther": 2694,
    "paidAmount": 3700,
    "paymentChannel": "GELİR FİŞ 16",
    "paymentDate": "21.01.2026"
  },
  {
    "id": "elitkent_22",
    "apartmentId": "apt_elitkent_b",
    "name": "Fayık TAŞAN",
    "aptNo": "22",
    "phone": "Girilmedi",
    "balance": -3358,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 2358,
    "paidAmount": 0,
    "paymentChannel": "",
    "paymentDate": ""
  },
  {
    "id": "elitkent_23",
    "apartmentId": "apt_elitkent_b",
    "name": "Mehmet Ali TİRYAKİ",
    "aptNo": "23",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 3022,
    "paidAmount": 4022,
    "paymentChannel": "BANKA",
    "paymentDate": "19-21.01.2026"
  },
  {
    "id": "elitkent_24",
    "apartmentId": "apt_elitkent_b",
    "name": "Hakan KARAHASAN",
    "aptNo": "24",
    "phone": "Girilmedi",
    "balance": 0.67,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -2.67,
    "gasDelay": 0,
    "gasOther": 2325,
    "paidAmount": 3323,
    "paymentChannel": "BANKA",
    "paymentDate": "19.01.2026"
  },
  {
    "id": "elitkent_25",
    "apartmentId": "apt_elitkent_b",
    "name": "Gürcan Poyraz ÖZENÇ",
    "aptNo": "25",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 2358,
    "paidAmount": 3358,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_26",
    "apartmentId": "apt_elitkent_b",
    "name": "Nuri DÖLEK",
    "aptNo": "26",
    "phone": "Girilmedi",
    "balance": 1.25,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -2.25,
    "gasDelay": 0,
    "gasOther": 3501,
    "paidAmount": 4500,
    "paymentChannel": "BANKA",
    "paymentDate": "17.01.2026"
  },
  {
    "id": "elitkent_27",
    "apartmentId": "apt_elitkent_b",
    "name": "Faik KÜÇÜKBULUT",
    "aptNo": "27",
    "phone": "Girilmedi",
    "balance": 3.02,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -0.52,
    "gasDelay": 0,
    "gasOther": 4367.5,
    "paidAmount": 5370,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_28",
    "apartmentId": "apt_elitkent_b",
    "name": "Semih ADALIOĞLU",
    "aptNo": "28",
    "phone": "Girilmedi",
    "balance": 3,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 3022,
    "paidAmount": 4025,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_29",
    "apartmentId": "apt_elitkent_b",
    "name": "Hidayet TEKİN",
    "aptNo": "29",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 3335.5,
    "paidAmount": 4335.5,
    "paymentChannel": "BANKA",
    "paymentDate": "14.01.2026"
  },
  {
    "id": "elitkent_30",
    "apartmentId": "apt_elitkent_b",
    "name": "Aslan ÇİFCİ",
    "aptNo": "30",
    "phone": "Girilmedi",
    "balance": 0.2,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 2877,
    "paidAmount": 3877.2,
    "paymentChannel": "BANKA",
    "paymentDate": "15-19.01.2026"
  },
  {
    "id": "elitkent_31",
    "apartmentId": "apt_elitkent_b",
    "name": "Nebahat TÜRİDİ",
    "aptNo": "31",
    "phone": "Girilmedi",
    "balance": 48.04,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 14.05,
    "gasDelay": 1.41,
    "gasOther": 2036.5,
    "paidAmount": 3100,
    "paymentChannel": "BANKA",
    "paymentDate": "19.01.2026"
  },
  {
    "id": "elitkent_32",
    "apartmentId": "apt_elitkent_b",
    "name": "Furkan KÖSE",
    "aptNo": "32",
    "phone": "Girilmedi",
    "balance": 10.52,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -32.52,
    "gasDelay": 0,
    "gasOther": 3022,
    "paidAmount": 4000,
    "paymentChannel": "BANKA",
    "paymentDate": "27.01.2026"
  },
  {
    "id": "elitkent_33",
    "apartmentId": "apt_elitkent_b",
    "name": "Gökhan SELAM",
    "aptNo": "33",
    "phone": "Girilmedi",
    "balance": -4076,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 3076,
    "paidAmount": 0,
    "paymentChannel": "",
    "paymentDate": ""
  },
  {
    "id": "elitkent_34",
    "apartmentId": "apt_elitkent_b",
    "name": "Erdinç ÖZDEMİR",
    "aptNo": "34",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 2904,
    "paidAmount": 3904,
    "paymentChannel": "BANKA-GİDER FİŞ 20",
    "paymentDate": "15-21.01.2026"
  },
  {
    "id": "elitkent_35",
    "apartmentId": "apt_elitkent_b",
    "name": "Mustafa KIYOĞLU",
    "aptNo": "35",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 3022,
    "paidAmount": 4022,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_36",
    "apartmentId": "apt_elitkent_b",
    "name": "Murat DANA",
    "aptNo": "36",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 2710,
    "paidAmount": 3710,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_37",
    "apartmentId": "apt_elitkent_b",
    "name": "Ziya SABİTOĞLU",
    "aptNo": "37",
    "phone": "Girilmedi",
    "balance": -4789.69,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 2853.35,
    "gasDelay": 285.34,
    "gasOther": 3501,
    "paidAmount": 2850,
    "paymentChannel": "BANKA",
    "paymentDate": "03.01.2026"
  },
  {
    "id": "elitkent_38",
    "apartmentId": "apt_elitkent_b",
    "name": "Dursun ABALI",
    "aptNo": "38",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 4225.5,
    "gasDelay": 422.55,
    "gasOther": 5016.5,
    "paidAmount": 10664.55,
    "paymentChannel": "BANKA",
    "paymentDate": "19.01.2026"
  },
  {
    "id": "elitkent_39",
    "apartmentId": "apt_elitkent_b",
    "name": "Serdar KARAŞ",
    "aptNo": "39",
    "phone": "Girilmedi",
    "balance": 0.63,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": -7.63,
    "gasDelay": 0,
    "gasOther": 3022,
    "paidAmount": 4015,
    "paymentChannel": "BANKA",
    "paymentDate": "14.01.2026"
  },
  {
    "id": "elitkent_40",
    "apartmentId": "apt_elitkent_b",
    "name": "Cemil TÜRKMEN",
    "aptNo": "40",
    "phone": "Girilmedi",
    "balance": 0,
    "type": "ev_sahibi",
    "dues": 1000,
    "previousDebt": 0,
    "gasDelay": 0,
    "gasOther": 3472.5,
    "paidAmount": 4472.5,
    "paymentChannel": "BANKA",
    "paymentDate": "15.01.2026"
  },
  {
    "id": "elitkent_41",
    "apartmentId": "apt_elitkent_b",
    "name": "HASAN TEKİN",
    "aptNo": "41",
    "phone": "Girilmedi",
    "balance": -5056.91,
    "type": "ev_sahibi",
    "dues": 0,
    "previousDebt": 5506.28,
    "gasDelay": 550.63,
    "gasOther": 0,
    "paidAmount": 1000,
    "paymentChannel": "BANKA",
    "paymentDate": "21.01.2026"
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    "id": "t1",
    "apartmentId": "apt_1",
    "type": "income",
    "amount": 500,
    "description": "Aidat Ödemesi (Daire 1)",
    "date": new Date('2026-05-01'),
    "residentId": "1"
  },
  {
    "id": "t2",
    "apartmentId": "apt_1",
    "type": "expense",
    "amount": 1200,
    "description": "Asansör Bakımı",
    "date": new Date('2026-05-05')
  },
  {
    "id": "t3",
    "type": "personnel_expense",
    "amount": 17000,
    "description": "Hasan Usta Maaş",
    "date": new Date('2026-05-01'),
    "staffId": "s1"
  },
  {
    "id": "t4",
    "type": "other_expense",
    "amount": 500,
    "description": "Yazılım Lisans",
    "date": new Date('2026-05-02')
  },
  {
    "id": "t_elitkent_1",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 5110.54,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_1"
  },
  {
    "id": "t_elitkent_2",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4439,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-16'),
    "residentId": "elitkent_2"
  },
  {
    "id": "t_elitkent_3",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4109.5,
    "description": "Ocak Ödemesi (GİDER FİŞ 16)",
    "date": new Date('2025-12-21'),
    "residentId": "elitkent_3"
  },
  {
    "id": "t_elitkent_4",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 5486.5,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_4"
  },
  {
    "id": "t_elitkent_5",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 5835,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-17'),
    "residentId": "elitkent_5"
  },
  {
    "id": "t_elitkent_6",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4500,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_6"
  },
  {
    "id": "t_elitkent_7",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3036.5,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_7"
  },
  {
    "id": "t_elitkent_8",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3102,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_8"
  },
  {
    "id": "t_elitkent_9",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3500,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_9"
  },
  {
    "id": "t_elitkent_10",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 5298.1,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_10"
  },
  {
    "id": "t_elitkent_11",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 100,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_11"
  },
  {
    "id": "t_elitkent_12",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4187.5,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-21'),
    "residentId": "elitkent_12"
  },
  {
    "id": "t_elitkent_13",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3358,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-14'),
    "residentId": "elitkent_13"
  },
  {
    "id": "t_elitkent_14",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3358,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_14"
  },
  {
    "id": "t_elitkent_15",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4000,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_15"
  },
  {
    "id": "t_elitkent_16",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3243,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-24'),
    "residentId": "elitkent_16"
  },
  {
    "id": "t_elitkent_17",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3858,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_17"
  },
  {
    "id": "t_elitkent_18",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4892,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_18"
  },
  {
    "id": "t_elitkent_19",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 5005,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-17'),
    "residentId": "elitkent_19"
  },
  {
    "id": "t_elitkent_20",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4988.5,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_20"
  },
  {
    "id": "t_elitkent_21",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3700,
    "description": "Ocak Ödemesi (GELİR FİŞ 16)",
    "date": new Date('2026-01-21'),
    "residentId": "elitkent_21"
  },
  {
    "id": "t_elitkent_23",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4022,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_23"
  },
  {
    "id": "t_elitkent_24",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3323,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_24"
  },
  {
    "id": "t_elitkent_25",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3358,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_25"
  },
  {
    "id": "t_elitkent_26",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4500,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-17'),
    "residentId": "elitkent_26"
  },
  {
    "id": "t_elitkent_27",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 5370,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_27"
  },
  {
    "id": "t_elitkent_28",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4025,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_28"
  },
  {
    "id": "t_elitkent_29",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4335.5,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-14'),
    "residentId": "elitkent_29"
  },
  {
    "id": "t_elitkent_30",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3877.2,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_30"
  },
  {
    "id": "t_elitkent_31",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3100,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_31"
  },
  {
    "id": "t_elitkent_32",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4000,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-27'),
    "residentId": "elitkent_32"
  },
  {
    "id": "t_elitkent_34",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3904,
    "description": "Ocak Ödemesi (BANKA-GİDER FİŞ 20)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_34"
  },
  {
    "id": "t_elitkent_35",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4022,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_35"
  },
  {
    "id": "t_elitkent_36",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 3710,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_36"
  },
  {
    "id": "t_elitkent_37",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 2850,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-03'),
    "residentId": "elitkent_37"
  },
  {
    "id": "t_elitkent_38",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 10664.55,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-19'),
    "residentId": "elitkent_38"
  },
  {
    "id": "t_elitkent_39",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4015,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-14'),
    "residentId": "elitkent_39"
  },
  {
    "id": "t_elitkent_40",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 4472.5,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-15'),
    "residentId": "elitkent_40"
  },
  {
    "id": "t_elitkent_41",
    "apartmentId": "apt_elitkent_b",
    "type": "income",
    "amount": 1000,
    "description": "Ocak Ödemesi (BANKA)",
    "date": new Date('2026-01-21'),
    "residentId": "elitkent_41"
  }
];

const INITIAL_STAFFS: Staff[] = [
  { id: 's1', name: 'Hasan Usta', role: 'Kapıcı', phone: '05559998877', salary: 17000 }
];

const INITIAL_PREDEFINED_JOBS: PredefinedJob[] = [
  { id: 'pj1', name: 'Çöp Toplama', defaultAmount: 100 },
  { id: 'pj2', name: 'Kat Temizliği', defaultAmount: 200 },
  { id: 'pj3', name: 'Bahçe Sulama / Bakım', defaultAmount: 150 },
  { id: 'pj4', name: 'Kazan Dairesi Kontrolü', defaultAmount: 120 },
];

const INITIAL_STAFF_JOBS: StaffJob[] = [
  { id: 'sj1', staffId: 's1', buildingId: 'apt_1', jobType: 'Çöp Toplama', description: 'Güneş Apartmanı Çöp Toplama', amount: 100, date: new Date('2026-05-18') },
  { id: 'sj2', staffId: 's1', buildingId: 'apt_1', jobType: 'Kat Temizliği', description: 'Güneş Apartmanı Koridor Temizliği', amount: 200, date: new Date('2026-05-19') },
];

const getNextMonthKey = (monthKey: string): string => {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr);
  let month = parseInt(monthStr);
  month++;
  if (month > 12) {
    month = 1;
    year++;
  }
  return `${year}-${month.toString().padStart(2, '0')}`;
};

const formatMonthKey = (key: string): string => {
  const [year, month] = key.split('-');
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  const mIndex = parseInt(month) - 1;
  return `${monthNames[mIndex] || month} ${year}`;
};

const parseTurkishOrEnglishFloat = (str: string): number => {
  let cleanStr = str.replace(/[^\d.,-]/g, '').trim(); // Keep only digits, dots, commas, minus
  if (!cleanStr) return NaN;
  
  if (cleanStr.includes('.') && cleanStr.includes(',')) {
    const lastDot = cleanStr.lastIndexOf('.');
    const lastComma = cleanStr.lastIndexOf(',');
    if (lastDot > lastComma) {
      cleanStr = cleanStr.replace(/,/g, '');
    } else {
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    }
  } else if (cleanStr.includes(',')) {
    cleanStr = cleanStr.replace(',', '.');
  }
  return parseFloat(cleanStr);
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [staffJobs, setStaffJobs] = useState<StaffJob[]>([]);
  const [predefinedJobs, setPredefinedJobs] = useState<PredefinedJob[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>(['2026-01']);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // API Load Effect
  useEffect(() => {
    fetch('http://localhost:5000/api/db')
      .then(res => res.json())
      .then(data => {
        setApartments(data.apartments || []);
        setResidents(data.residents || []);
        setTransactions((data.transactions || []).map((t: any) => ({ ...t, date: new Date(t.date) })));
        setStaffs(data.staffs || []);
        setStaffJobs((data.staffJobs || []).map((j: any) => ({ ...j, date: new Date(j.date) })));
        setPredefinedJobs(data.predefinedJobs || []);
        setAvailableMonths(data.availableMonths || ['2026-01']);
        setPolls(data.polls || []);
        setTickets(data.tickets || []);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend API not running, falling back to localStorage/mock defaults:", err);
        const savedApts = localStorage.getItem('crm_apartments');
        setApartments(savedApts ? JSON.parse(savedApts) : INITIAL_APARTMENTS);
        const savedTrans = localStorage.getItem('crm_transactions');
        setTransactions(savedTrans ? JSON.parse(savedTrans).map((t: any) => ({ ...t, date: new Date(t.date) })) : INITIAL_TRANSACTIONS);
        const savedRes = localStorage.getItem('crm_residents');
        setResidents(savedRes ? JSON.parse(savedRes) : INITIAL_RESIDENTS);
        const savedStaffs = localStorage.getItem('crm_staffs');
        setStaffs(savedStaffs ? JSON.parse(savedStaffs) : INITIAL_STAFFS);
        const savedJobs = localStorage.getItem('crm_staff_jobs');
        setStaffJobs(savedJobs ? JSON.parse(savedJobs).map((j: any) => ({ ...j, date: new Date(j.date) })) : INITIAL_STAFF_JOBS);
        const savedMonths = localStorage.getItem('crm_available_months');
        setAvailableMonths(savedMonths ? JSON.parse(savedMonths) : ['2026-01', '2026-02', '2026-03']);
        setPredefinedJobs(INITIAL_PREDEFINED_JOBS);
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
        setLoading(false);
      });
  }, []);

  // API Sync Effect
  useEffect(() => {
    if (loading) return;
    const dbState = {
      apartments,
      residents,
      transactions,
      staffs,
      staffJobs,
      predefinedJobs,
      availableMonths,
      polls,
      tickets
    };
    fetch('http://localhost:5000/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbState)
    }).catch(err => console.warn("Failed to sync with API backend, saving to localStorage:", err));

    localStorage.setItem('crm_apartments', JSON.stringify(apartments));
    localStorage.setItem('crm_transactions', JSON.stringify(transactions));
    localStorage.setItem('crm_residents', JSON.stringify(residents));
    localStorage.setItem('crm_staffs', JSON.stringify(staffs));
    localStorage.setItem('crm_staff_jobs', JSON.stringify(staffJobs));
    localStorage.setItem('crm_available_months', JSON.stringify(availableMonths));
  }, [apartments, residents, transactions, staffs, staffJobs, predefinedJobs, availableMonths, polls, tickets, loading]);

  const handleResetToDefaults = () => {
    if (window.confirm("Tüm yerel verileri sıfırlayıp Elitkent B Blok gerçek verilerini ve varsayılan ayarları yeniden yüklemek istediğinize emin misiniz? Bu işlem yaptığınız tüm değişiklikleri geri alacaktır.")) {
      localStorage.removeItem('crm_apartments');
      localStorage.removeItem('crm_transactions');
      localStorage.removeItem('crm_residents');
      localStorage.removeItem('crm_staffs');
      localStorage.removeItem('crm_staff_jobs');
      localStorage.removeItem('crm_predefined_jobs');
      localStorage.removeItem('crm_available_months');
      window.location.reload();
    }
  };

  // Modals
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isOtherExpenseModalOpen, setIsOtherExpenseModalOpen] = useState(false);
  const [isPersonnelExpenseModalOpen, setIsPersonnelExpenseModalOpen] = useState(false);
  
  // New Modals
  const [isResidentDetailModalOpen, setIsResidentDetailModalOpen] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');
  const [debitAmountSingle, setDebitAmountSingle] = useState('');
  const [debitDescSingle, setDebitDescSingle] = useState('');

  const [isAddStaffJobModalOpen, setIsAddStaffJobModalOpen] = useState(false);
  const [selectedStaffIdForJob, setSelectedStaffIdForJob] = useState<string | null>(null);
  const [jobBuildingId, setJobBuildingId] = useState(apartments[0]?.id || '');
  const [jobTypeName, setJobTypeName] = useState(predefinedJobs[0]?.name || '');
  const [jobAmount, setJobAmount] = useState(predefinedJobs[0]?.defaultAmount.toString() || '100');
  const [jobDesc, setJobDesc] = useState('');

  const [isStaffPaymentModalOpen, setIsStaffPaymentModalOpen] = useState(false);
  const [selectedStaffIdForPayment, setSelectedStaffIdForPayment] = useState<string | null>(null);
  const [paymentToStaffAmount, setPaymentToStaffAmount] = useState('');
  const [paymentToStaffDesc, setPaymentToStaffDesc] = useState('');

  const [isFuelExpenseModalOpen, setIsFuelExpenseModalOpen] = useState(false);
  const [selectedAptIdForFuel, setSelectedAptIdForFuel] = useState<string>('');
  const [fuelTotalInvoice, setFuelTotalInvoice] = useState('');
  const [fuelExcelText, setFuelExcelText] = useState('');
  interface FuelPreviewItem {
    aptNo: string;
    name: string;
    amount: number;
    found: boolean;
    residentId?: string;
  }
  const [fuelPreviewList, setFuelPreviewList] = useState<FuelPreviewItem[]>([]);

  // Import Wizard states
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importType, setImportType] = useState<'residents' | 'debts' | 'payments'>('residents');
  const [importRawText, setImportRawText] = useState('');
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<string[][]>([]);
  const [importMapping, setImportMapping] = useState<Record<string, number>>({});
  const [importTargetBuildingId, setImportTargetBuildingId] = useState(apartments[0]?.id || '');
  const [importPreviewList, setImportPreviewList] = useState<any[]>([]);

  // Editing state
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Poll (Anket) management states
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [newPollTargetId, setNewPollTargetId] = useState('all');

  // Ticket (Arıza) management states
  const [filterBuildingId, setFilterBuildingId] = useState('all');
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'Açık' | 'İşlemde' | 'Çözüldü'>('Açık');
  const [editStaffId, setEditStaffId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

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

  // Muhasebe Defteri (Spreadsheet) States
  const [sheetSearch, setSheetSearch] = useState('');
  const [isSheetEditModalOpen, setIsSheetEditModalOpen] = useState(false);
  const [sheetResId, setSheetResId] = useState<string | null>(null);
  const [sheetDues, setSheetDues] = useState('');
  const [sheetPrevDebt, setSheetPrevDebt] = useState('');
  const [sheetGasDelay, setSheetGasDelay] = useState('');
  const [sheetGasOther, setSheetGasOther] = useState('');
  const [sheetPaidAmount, setSheetPaidAmount] = useState('');
  const [sheetChannel, setSheetChannel] = useState('');
  const [sheetDate, setSheetDate] = useState('');

  // Selected period tracking
  const [selectedMonth, setSelectedMonth] = useState('2026-01');

  // Synchronize resident root properties to match the selected monthly period
  useEffect(() => {
    setResidents(prev => prev.map(r => {
      const mData = r.monthlyData?.[selectedMonth];
      if (mData) {
        const total = (mData.dues || 0) + (mData.previousDebt || 0) + (mData.gasDelay || 0) + (mData.gasOther || 0);
        const remaining = total - (mData.paidAmount || 0);
        return {
          ...r,
          dues: mData.dues,
          previousDebt: mData.previousDebt,
          gasDelay: mData.gasDelay,
          gasOther: mData.gasOther,
          paidAmount: mData.paidAmount,
          paymentChannel: mData.paymentChannel,
          paymentDate: mData.paymentDate,
          balance: -remaining
        };
      }
      return r;
    }));
  }, [selectedMonth]);

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
      const oldT = transactions.find(t => t.id === editingTransactionId);
      if (oldT) {
        adjustResidentBalanceOnTransactionEdit(oldT, parseFloat(amount));
      }
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

  // 1. Personel Görev Ekleme
  const handleSaveStaffJob = () => {
    if (!selectedStaffIdForJob || !jobTypeName || !jobAmount) return;
    const newJob: StaffJob = {
      id: Math.random().toString(),
      staffId: selectedStaffIdForJob,
      buildingId: jobBuildingId,
      jobType: jobTypeName,
      description: jobDesc || `${jobTypeName} Görevi`,
      amount: parseFloat(jobAmount),
      date: new Date()
    };
    setStaffJobs([newJob, ...staffJobs]);
    setJobDesc('');
    setIsAddStaffJobModalOpen(false);
  };

  // 2. Personel Ödeme Yapma
  const handleSaveStaffPayment = () => {
    if (!selectedStaffIdForPayment || !paymentToStaffAmount) return;
    const staff = staffs.find(s => s.id === selectedStaffIdForPayment);
    if (!staff) return;
    const amountVal = parseFloat(paymentToStaffAmount);
    
    // Genel işleme ekle (personnel_expense türünde)
    const newTransaction: Transaction = {
      id: Math.random().toString(),
      type: 'personnel_expense',
      amount: amountVal,
      description: paymentToStaffDesc || `${staff.name} Ödemesi`,
      date: new Date(),
      staffId: staff.id
    };
    setTransactions([newTransaction, ...transactions]);
    
    setPaymentToStaffAmount(''); setPaymentToStaffDesc('');
    setIsStaffPaymentModalOpen(false);
  };

  // 3. Sakin Ödeme Al (Hızlı Tahsilat)
  const handleResidentPayment = (residentId: string) => {
    if (!paymentAmount) return;
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return;
    const payVal = parseFloat(paymentAmount);

    // Sakin bakiyesini ve aylık verisini güncelle
    setResidents(residents.map(r => {
      if (r.id === residentId) {
        const currentMonthData = r.monthlyData?.[selectedMonth] || {
          dues: r.dues || 0,
          previousDebt: r.previousDebt || 0,
          gasDelay: r.gasDelay || 0,
          gasOther: r.gasOther || 0,
          paidAmount: r.paidAmount || 0,
          paymentChannel: r.paymentChannel || '',
          paymentDate: r.paymentDate || ''
        };
        const updatedMonthRecord = {
          ...currentMonthData,
          paidAmount: (currentMonthData.paidAmount || 0) + payVal,
          paymentChannel: currentMonthData.paymentChannel || 'KASA',
          paymentDate: currentMonthData.paymentDate || format(new Date(), 'dd.MM.yyyy')
        };
        return {
          ...r,
          balance: r.balance + payVal,
          paidAmount: updatedMonthRecord.paidAmount,
          paymentChannel: updatedMonthRecord.paymentChannel,
          paymentDate: updatedMonthRecord.paymentDate,
          monthlyData: {
            ...(r.monthlyData || {}),
            [selectedMonth]: updatedMonthRecord
          }
        };
      }
      return r;
    }));

    // Kasa kaydı oluştur (gelir olarak)
    const newTransaction: Transaction = {
      id: Math.random().toString(),
      apartmentId: resident.apartmentId,
      type: 'income',
      amount: payVal,
      description: paymentDesc || `${formatMonthKey(selectedMonth)} Aidat Tahsilatı (Daire ${resident.aptNo})`,
      date: new Date(),
      residentId: resident.id
    };
    setTransactions([newTransaction, ...transactions]);

    setPaymentAmount(''); setPaymentDesc('');
    alert('Tahsilat işlemi başarıyla tamamlandı.');
  };

  // 4. Sakin Münferit Borçlandır
  const handleResidentDebit = (residentId: string) => {
    if (!debitAmountSingle || !debitDescSingle) return;
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return;
    const debtVal = parseFloat(debitAmountSingle);

    // Sakin bakiyesini düşür ve aylık verisini güncelle
    setResidents(residents.map(r => {
      if (r.id === residentId) {
        const currentMonthData = r.monthlyData?.[selectedMonth] || {
          dues: r.dues || 0,
          previousDebt: r.previousDebt || 0,
          gasDelay: r.gasDelay || 0,
          gasOther: r.gasOther || 0,
          paidAmount: r.paidAmount || 0,
          paymentChannel: r.paymentChannel || '',
          paymentDate: r.paymentDate || ''
        };
        const updatedMonthRecord = {
          ...currentMonthData,
          gasOther: (currentMonthData.gasOther || 0) + debtVal
        };
        return {
          ...r,
          balance: r.balance - debtVal,
          gasOther: updatedMonthRecord.gasOther,
          monthlyData: {
            ...(r.monthlyData || {}),
            [selectedMonth]: updatedMonthRecord
          }
        };
      }
      return r;
    }));

    setDebitAmountSingle(''); setDebitDescSingle('');
    alert('Borçlandırma işlemi başarıyla tamamlandı.');
  };

  // 5. Excel / CSV Yakıt Okuma Ayrıştırıcı
  const handleParseFuelExcel = () => {
    if (!fuelExcelText) {
      alert('Lütfen Excel/CSV verilerini yapıştırın.');
      return;
    }
    const targetAptId = selectedAptIdForFuel || selectedAptId;
    if (!targetAptId) {
      alert('Lütfen işlem yapacağınız binayı seçin.');
      return;
    }

    const lines = fuelExcelText.trim().split('\n');
    const previews: FuelPreviewItem[] = [];

    lines.forEach(line => {
      let parts = line.split('\t'); // Excel kopyalaması
      if (parts.length <= 1) {
        parts = line.split(';'); // CSV noktalı virgül
      }
      if (parts.length <= 1) {
        parts = line.split(','); // CSV virgül
      }

      const filteredParts = parts.map(p => p.trim()).filter(p => p !== '');

      if (filteredParts.length >= 2) {
        const key = filteredParts[0]; // Daire no veya İsim
        const amtStr = filteredParts[filteredParts.length - 1];
        const amt = parseTurkishOrEnglishFloat(amtStr);

        if (!isNaN(amt)) {
          // Binadaki sakinle eşleştirme (daire numarasına veya isme göre)
          const matched = residents.find(r => 
            r.apartmentId === targetAptId && 
            (r.aptNo === key || 
             r.aptNo === `Daire ${key}` || 
             r.name.toLowerCase().includes(key.toLowerCase()) || 
             r.aptNo === key.replace(/\D/g,'') || 
             `Daire ${r.aptNo}` === key)
          );

          previews.push({
            aptNo: matched ? matched.aptNo : `Daire ${key}`,
            name: matched ? matched.name : 'Eşleşen Sakin Bulunamadı',
            amount: amt,
            found: !!matched,
            residentId: matched ? matched.id : undefined
          });
        }
      }
    });

    setFuelPreviewList(previews);
  };

  // 6. Yakıt Gideri Borçlandırmasını Uygula
  const handleApplyFuelExpense = () => {
    if (fuelPreviewList.length === 0) return;
    const targetAptId = selectedAptIdForFuel || selectedAptId;
    if (!targetAptId) return;

    const invoiceAmt = parseFloat(fuelTotalInvoice) || fuelPreviewList.reduce((acc, c) => acc + c.amount, 0);

    // Sakinleri borçlandır ve aylık verisini güncelle
    const updatedResidents = residents.map(r => {
      const match = fuelPreviewList.find(p => p.residentId === r.id);
      if (match) {
        const currentMonthData = r.monthlyData?.[selectedMonth] || {
          dues: r.dues || 0,
          previousDebt: r.previousDebt || 0,
          gasDelay: r.gasDelay || 0,
          gasOther: r.gasOther || 0,
          paidAmount: r.paidAmount || 0,
          paymentChannel: r.paymentChannel || '',
          paymentDate: r.paymentDate || ''
        };
        const updatedMonthRecord = {
          ...currentMonthData,
          gasOther: (currentMonthData.gasOther || 0) + match.amount
        };
        return {
          ...r,
          balance: r.balance - match.amount,
          gasOther: updatedMonthRecord.gasOther,
          monthlyData: {
            ...(r.monthlyData || {}),
            [selectedMonth]: updatedMonthRecord
          }
        };
      }
      return r;
    });
    setResidents(updatedResidents);

    // Binaya yakıt faturası gideri yaz
    const newTransaction: Transaction = {
      id: Math.random().toString(),
      apartmentId: targetAptId || undefined,
      type: 'expense',
      amount: invoiceAmt,
      description: `${formatMonthKey(selectedMonth)} Yakıt Gideri Paylaştırma Faturası`,
      date: new Date()
    };
    setTransactions([newTransaction, ...transactions]);

    setFuelTotalInvoice('');
    setFuelExcelText('');
    setFuelPreviewList([]);
    setIsFuelExpenseModalOpen(false);
    alert('Yakıt gideri paylaşımı sakinlere borç olarak yansıtıldı.');
  };

  // 7. Raporu Excel (CSV) Olarak İndir
  const handleExportExcel = () => {
    if (!selectedAptId) return;
    const apt = apartments.find(a => a.id === selectedAptId);
    if (!apt) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    csvContent += `Bina Durum Raporu: ${apt.name}\r\n`;
    csvContent += `Tarih: ${format(new Date(), 'dd.MM.yyyy')}\r\n\r\n`;

    // Finansal Özet
    csvContent += "FINANSAL OZET\r\n";
    csvContent += `Toplam Gelir;₺${totalIncome}\r\n`;
    csvContent += `Toplam Gider;₺${totalExpense}\r\n`;
    csvContent += `Kasa Bakiyesi;₺${balance}\r\n\r\n`;

    // Sakin Listesi
    csvContent += "SAKINLER LISTESI\r\n";
    csvContent += "Daire No;Sakin Adi;Rol;Telefon;Bakiye\r\n";
    filteredResidents.forEach(r => {
      csvContent += `${r.aptNo};${r.name};${r.type === 'kiraci' ? 'Kiracı' : 'Ev Sahibi'};${r.phone};₺${r.balance}\r\n`;
    });
    csvContent += "\r\n";

    // Hareketler
    csvContent += "GELIR-GIDER ISLEMLERI\r\n";
    csvContent += "Tarih;Aciklama;Tur;Tutar\r\n";
    filteredTransactions.forEach(t => {
      csvContent += `${format(t.date, 'dd.MM.yyyy')};${t.description};${t.type === 'income' ? 'Gelir' : 'Gider'};₺${t.amount}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${apt.name.replace(/ /g, "_")}_raporu.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 8. PDF Yazdır
  const handlePrintPDF = () => {
    window.print();
  };

  // 9. Excel/Sheets Çözümleme (Adım 1 -> Adım 2)
  const handleProcessImportRawText = () => {
    if (!importRawText.trim()) {
      alert('Lütfen içe aktarılacak Excel tablosunu yapıştırın.');
      return;
    }

    const lines = importRawText.trim().split('\n');
    if (lines.length < 2) {
      alert('Excel verisinde yeterli satır bulunamadı (En azından bir başlık satırı ve bir veri satırı olmalı).');
      return;
    }

    // Excel tab ayracı (TSV), CSV virgül ya da noktalı virgül
    let delimiter = '\t';
    if (lines[0].split(';').length > lines[0].split('\t').length) delimiter = ';';
    else if (lines[0].split(',').length > lines[0].split('\t').length) delimiter = ',';

    const parsedHeaders = lines[0].split(delimiter).map(h => h.trim());
    const parsedRows = lines.slice(1).map(line => line.split(delimiter).map(cell => cell.trim())).filter(row => row.some(cell => cell !== ''));

    setImportHeaders(parsedHeaders);
    setImportRows(parsedRows);

    // Akıllı Otomatik Eşleştirme (Sözcük analizi)
    const initialMapping: Record<string, number> = {};
    parsedHeaders.forEach((header, idx) => {
      const hLower = header.toLowerCase();
      if (hLower.includes('daire') || hLower.includes('no') || hLower.includes('apt') || hLower.includes('kapı')) {
        initialMapping['aptNo'] = idx;
      } else if (hLower.includes('ad') || hLower.includes('soyad') || hLower.includes('isim') || hLower.includes('sakin') || hLower.includes('kisi')) {
        initialMapping['name'] = idx;
      } else if (hLower.includes('telefon') || hLower.includes('tel') || hLower.includes('gsm') || hLower.includes('phone') || hLower.includes('cep')) {
        initialMapping['phone'] = idx;
      } else if (hLower.includes('rol') || hLower.includes('durum') || hLower.includes('tip') || hLower.includes('kiraci') || hLower.includes('sahip')) {
        initialMapping['type'] = idx;
      } else if (hLower.includes('bakiye') || hLower.includes('borc') || hLower.includes('alacak') || hLower.includes('tutar') || hLower.includes('balance') || hLower.includes('tl') || hLower.includes('amount')) {
        initialMapping['balance'] = idx;
      }
    });

    setImportMapping(initialMapping);
    setImportStep(2);
  };

  // 10. İthalat Önizleme Oluştur (Adım 2 -> Adım 3)
  const handleGenerateImportPreview = () => {
    if (importMapping['aptNo'] === undefined || importMapping['name'] === undefined) {
      alert('Lütfen en azından "Daire No" ve "Sakin Adı" sütunlarını eşleştirin.');
      return;
    }

    const previewItems = importRows.map((row, idx) => {
      const aptNo = row[importMapping['aptNo']] || '';
      const name = row[importMapping['name']] || '';
      const phone = importMapping['phone'] !== undefined ? row[importMapping['phone']] || '' : '';
      
      let rawType = importMapping['type'] !== undefined ? row[importMapping['type']].toLowerCase() : '';
      const type: 'kiraci' | 'ev_sahibi' = (rawType.includes('sahip') || rawType.includes('ev') || rawType.includes('owner')) ? 'ev_sahibi' : 'kiraci';

      let balance = 0;
      if (importMapping['balance'] !== undefined) {
        const balStr = row[importMapping['balance']].replace('₺', '').replace(/\./g, '').replace(',', '.').trim();
        balance = parseFloat(balStr) || 0;
        // Eğer tabloda borç pozitif yazılmışsa, sisteme eksi bakiye yazmak için - ile çarparız
        if (balance > 0) balance = -balance;
      }

      // Mevcut sakinler içinde çakışma var mı?
      const exists = residents.find(r => 
        r.apartmentId === importTargetBuildingId && 
        (r.aptNo === aptNo || r.aptNo === `Daire ${aptNo}`)
      );

      return {
        key: idx.toString(),
        aptNo: aptNo.startsWith('Daire') ? aptNo : `Daire ${aptNo}`,
        name,
        phone: phone || 'Girilmedi',
        type,
        balance,
        exists: !!exists,
        residentId: exists ? exists.id : undefined
      };
    });

    setImportPreviewList(previewItems);
    setImportStep(3);
  };

  // 11. İthalatı Gerçekleştir ve Kaydet
  const handleExecuteImport = () => {
    if (importPreviewList.length === 0) return;

    if (importType === 'residents') {
      const addedResidents: Resident[] = [];
      const updatedResidents = [...residents];

      importPreviewList.forEach(item => {
        if (item.exists && item.residentId) {
          // Güncelle
          const idx = updatedResidents.findIndex(r => r.id === item.residentId);
          if (idx !== -1) {
            updatedResidents[idx] = {
              ...updatedResidents[idx],
              name: item.name,
              phone: item.phone,
              type: item.type,
              balance: item.balance // Başlangıç bakiyesini güncelle
            };
          }
        } else {
          // Yeni ekle
          const mData: Record<string, MonthlyRecord> = {};
          availableMonths.forEach(m => {
            mData[m] = {
              dues: 430,
              previousDebt: m === selectedMonth ? -item.balance : 0,
              gasDelay: 0,
              gasOther: 0,
              paidAmount: 0,
              paymentChannel: '',
              paymentDate: ''
            };
          });
          const newRes: Resident = {
            id: Math.random().toString(),
            apartmentId: importTargetBuildingId,
            name: item.name,
            aptNo: item.aptNo.replace('Daire ', ''),
            phone: item.phone,
            balance: item.balance,
            type: item.type,
            dues: 430,
            previousDebt: -item.balance,
            gasDelay: 0,
            gasOther: 0,
            paidAmount: 0,
            paymentChannel: '',
            paymentDate: '',
            monthlyData: mData
          };
          addedResidents.push(newRes);
        }
      });

      setResidents([...updatedResidents, ...addedResidents]);
      alert(`${importPreviewList.length} adet sakin kaydı (Yeni: ${addedResidents.length}, Güncellenen: ${importPreviewList.length - addedResidents.length}) başarıyla binalara işlendi.`);
    }

    // Reset Import States
    setImportStep(1);
    setImportRawText('');
    setImportHeaders([]);
    setImportRows([]);
    setImportMapping({});
    setImportPreviewList([]);
    
    // Yönlendir
    setSelectedAptId(importTargetBuildingId);
    setActiveTab('residents');
  };

  const openIncomeModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransactionId(transaction.id);
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
    } else {
      setEditingTransactionId(null);
      setDescription('');
      setAmount('');
    }
    setIsIncomeModalOpen(true);
  };

  const openExpenseModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransactionId(transaction.id);
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
    } else {
      setEditingTransactionId(null);
      setDescription('');
      setAmount('');
    }
    setIsExpenseModalOpen(true);
  };

  const handleAddPollOption = () => {
    if (newPollOptions.length < 5) {
      setNewPollOptions([...newPollOptions, '']);
    }
  };

  const handleSavePoll = () => {
    if (!newPollQuestion || newPollOptions.some(o => !o.trim())) {
      alert('Lütfen anket sorusunu ve en az iki seçeneği doldurun.');
      return;
    }
    const newPoll: Poll = {
      id: 'poll_' + Math.random().toString(),
      question: newPollQuestion,
      options: newPollOptions.filter(o => o.trim() !== ''),
      targetBuildingId: newPollTargetId,
      votes: {},
      active: true,
      date: new Date().toISOString()
    };
    setPolls([newPoll, ...polls]);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
    setNewPollTargetId('all');
    alert('Anket başarıyla oluşturuldu ve yayınlandı!');
  };

  const handleTogglePoll = (id: string) => {
    setPolls(polls.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleDeletePoll = (id: string) => {
    if (window.confirm("Bu anketi silmek istediğinize emin misiniz?")) {
      setPolls(polls.filter(p => p.id !== id));
    }
  };

  const handleStartEdit = (ticket: Ticket) => {
    setEditingTicketId(ticket.id);
    setEditStatus(ticket.status);
    setEditStaffId(ticket.assignedStaffId);
    setEditNotes(ticket.resolutionNotes || '');
  };

  const handleSaveTicket = (id: string) => {
    setTickets(tickets.map(t => t.id === id ? {
      ...t,
      status: editStatus,
      assignedStaffId: editStaffId,
      resolutionNotes: editNotes
    } : t));
    setEditingTicketId(null);
    alert('Arıza kaydı başarıyla güncellendi.');
  };

  const getResidentName = (id: string) => residents.find(r => r.id === id)?.name || 'Bilinmeyen Sakin';
  const getResidentAptNo = (id: string) => residents.find(r => r.id === id)?.aptNo || '-';

  const adjustResidentBalanceOnTransactionDelete = (t: Transaction) => {
    if (!t.residentId) return;
    
    setResidents(prevResidents => prevResidents.map(r => {
      if (r.id === t.residentId) {
        const year = t.date.getFullYear();
        const month = (t.date.getMonth() + 1).toString().padStart(2, '0');
        const monthKey = `${year}-${month}`;

        const currentMonthData = r.monthlyData?.[monthKey] || r.monthlyData?.[selectedMonth] || {
          dues: r.dues || 0,
          previousDebt: r.previousDebt || 0,
          gasDelay: r.gasDelay || 0,
          gasOther: r.gasOther || 0,
          paidAmount: r.paidAmount || 0,
          paymentChannel: r.paymentChannel || '',
          paymentDate: r.paymentDate || ''
        };

        const updatedMonthRecord = {
          ...currentMonthData,
          paidAmount: Math.max(0, (currentMonthData.paidAmount || 0) - t.amount)
        };

        const balanceDiff = t.type === 'income' ? -t.amount : t.amount;

        return {
          ...r,
          balance: r.balance + balanceDiff,
          paidAmount: monthKey === selectedMonth ? updatedMonthRecord.paidAmount : r.paidAmount,
          monthlyData: {
            ...(r.monthlyData || {}),
            [monthKey]: updatedMonthRecord
          }
        };
      }
      return r;
    }));
  };

  const adjustResidentBalanceOnTransactionEdit = (oldT: Transaction, newAmount: number) => {
    if (!oldT.residentId) return;

    const diff = newAmount - oldT.amount;
    if (diff === 0) return;

    setResidents(prevResidents => prevResidents.map(r => {
      if (r.id === oldT.residentId) {
        const year = oldT.date.getFullYear();
        const month = (oldT.date.getMonth() + 1).toString().padStart(2, '0');
        const monthKey = `${year}-${month}`;

        const currentMonthData = r.monthlyData?.[monthKey] || r.monthlyData?.[selectedMonth] || {
          dues: r.dues || 0,
          previousDebt: r.previousDebt || 0,
          gasDelay: r.gasDelay || 0,
          gasOther: r.gasOther || 0,
          paidAmount: r.paidAmount || 0,
          paymentChannel: r.paymentChannel || '',
          paymentDate: r.paymentDate || ''
        };

        const updatedMonthRecord = {
          ...currentMonthData,
          paidAmount: Math.max(0, (currentMonthData.paidAmount || 0) + diff)
        };

        const balanceDiff = oldT.type === 'income' ? diff : -diff;

        return {
          ...r,
          balance: r.balance + balanceDiff,
          paidAmount: monthKey === selectedMonth ? updatedMonthRecord.paidAmount : r.paidAmount,
          monthlyData: {
            ...(r.monthlyData || {}),
            [monthKey]: updatedMonthRecord
          }
        };
      }
      return r;
    }));
  };

  const handlePrintResidentPDF = (resident: Resident, residentApt?: Apartment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up engelleyiciyi devre dışı bırakın.');
      return;
    }

    const residentTrans = transactions.filter(t => t.residentId === resident.id);

    printWindow.document.write(`
      <html>
        <head>
          <title>${resident.name} - Hesap Kartı</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            h1 { font-size: 24px; color: #1e1b4b; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .info-item { margin-bottom: 10px; }
            .info-label { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .info-value { font-size: 15px; font-weight: bold; }
            .balance-box { grid-column: span 2; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; }
            .balance-value { font-size: 22px; font-weight: 800; }
            .balance-debt { color: #ef4444; }
            .balance-credit { color: #10b981; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; color: #475569; font-weight: bold; }
            tr:nth-child(even) { background: #f8fafc; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .badge-success { background: #dcfce7; color: #15803d; }
            .badge-danger { background: #fee2e2; color: #b91c1c; }
            .no-print-btn { display: block; margin-bottom: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
            @media print {
              .no-print-btn { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="no-print-btn" onclick="window.print()">Yazdır / PDF Olarak Kaydet</button>
          <h1>Sakin Hesap Kartı ve Cari Detayı</h1>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Sakin Adı</div>
              <div class="info-value">${resident.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Bağlı Bina / Daire</div>
              <div class="info-value">${residentApt?.name || 'Bilinmeyen Bina'} - Daire ${resident.aptNo}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Telefon</div>
              <div class="info-value">${resident.phone}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Rolü</div>
              <div class="info-value">${resident.type === 'ev_sahibi' ? 'Ev Sahibi' : 'Kiracı'}</div>
            </div>
            <div class="balance-box">
              <div class="info-label">Güncel Hesap Bakiyesi</div>
              <div class="balance-value ${resident.balance < 0 ? 'balance-debt' : 'balance-credit'}">
                ${resident.balance < 0 ? `Borç: ₺${Math.abs(resident.balance).toLocaleString()}` : `Alacak: ₺${resident.balance.toLocaleString()}`}
              </div>
            </div>
          </div>
          <h2>Geçmiş Hesap Hareketleri</h2>
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
              ${residentTrans.map(t => `
                <tr>
                  <td>${t.date.toLocaleDateString('tr-TR')}</td>
                  <td>${t.description}</td>
                  <td>
                    <span class="badge ${t.type === 'income' ? 'badge-success' : 'badge-danger'}">
                      ${t.type === 'income' ? 'Tahsilat' : 'Gider/Borç'}
                    </span>
                  </td>
                  <td style="font-weight: bold;">₺${t.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              ${residentTrans.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #64748b;">Hareket bulunmamaktadır.</td></tr>' : ''}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      const oldT = transactions.find(t => t.id === id);
      if (oldT) {
        adjustResidentBalanceOnTransactionDelete(oldT);
      }
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
      const mData: Record<string, MonthlyRecord> = {};
      availableMonths.forEach(m => {
        mData[m] = {
          dues: 430,
          previousDebt: 0,
          gasDelay: 0,
          gasOther: 0,
          paidAmount: 0,
          paymentChannel: '',
          paymentDate: ''
        };
      });
      const newResident: Resident = {
        id: Math.random().toString(),
        apartmentId: resAptId,
        name: resName,
        aptNo: resAptNo,
        phone: resPhone,
        balance: 0,
        type: resType,
        dues: 430,
        previousDebt: 0,
        gasDelay: 0,
        gasOther: 0,
        paidAmount: 0,
        paymentChannel: '',
        paymentDate: '',
        monthlyData: mData
      };
      setResidents([...residents, newResident]);
    }
    setIsResidentModalOpen(false);
  };

  const openSheetEditModal = (resident: Resident) => {
    setSheetResId(resident.id);
    const mData = resident.monthlyData?.[selectedMonth];
    if (mData) {
      setSheetDues(mData.dues !== undefined ? mData.dues.toString() : '');
      setSheetPrevDebt(mData.previousDebt !== undefined ? mData.previousDebt.toString() : '');
      setSheetGasDelay(mData.gasDelay !== undefined ? mData.gasDelay.toString() : '');
      setSheetGasOther(mData.gasOther !== undefined ? mData.gasOther.toString() : '');
      setSheetPaidAmount(mData.paidAmount !== undefined ? mData.paidAmount.toString() : '');
      setSheetChannel(mData.paymentChannel || '');
      setSheetDate(mData.paymentDate || '');
    } else {
      setSheetDues(resident.dues !== undefined ? resident.dues.toString() : '');
      setSheetPrevDebt(resident.previousDebt !== undefined ? resident.previousDebt.toString() : '');
      setSheetGasDelay(resident.gasDelay !== undefined ? resident.gasDelay.toString() : '');
      setSheetGasOther(resident.gasOther !== undefined ? resident.gasOther.toString() : '');
      setSheetPaidAmount(resident.paidAmount !== undefined ? resident.paidAmount.toString() : '');
      setSheetChannel(resident.paymentChannel || '');
      setSheetDate(resident.paymentDate || '');
    }
    setIsSheetEditModalOpen(true);
  };

  const handleSaveSheetResident = () => {
    if (!sheetResId) return;
    const duesVal = parseFloat(sheetDues) || 0;
    const prevDebtVal = parseFloat(sheetPrevDebt) || 0;
    const gasDelayVal = parseFloat(sheetGasDelay) || 0;
    const gasOtherVal = parseFloat(sheetGasOther) || 0;
    const paidAmountVal = parseFloat(sheetPaidAmount) || 0;
    
    const totalVal = duesVal + prevDebtVal + gasDelayVal + gasOtherVal;
    const remainingVal = totalVal - paidAmountVal;
    const newBalance = -remainingVal;

    setResidents(residents.map(r => r.id === sheetResId ? {
      ...r,
      dues: duesVal,
      previousDebt: prevDebtVal,
      gasDelay: gasDelayVal,
      gasOther: gasOtherVal,
      paidAmount: paidAmountVal,
      paymentChannel: sheetChannel,
      paymentDate: sheetDate,
      balance: newBalance,
      monthlyData: {
        ...(r.monthlyData || {}),
        [selectedMonth]: {
          dues: duesVal,
          previousDebt: prevDebtVal,
          gasDelay: gasDelayVal,
          gasOther: gasOtherVal,
          paidAmount: paidAmountVal,
          paymentChannel: sheetChannel,
          paymentDate: sheetDate
        }
      }
    } : r));

    // Keep transactions synced
    if (paidAmountVal > 0) {
      const transactionDesc = `${formatMonthKey(selectedMonth)} Ödemesi (${sheetChannel || 'BANKA'})`;
      const existingTIndex = transactions.findIndex(t => t.residentId === sheetResId && t.apartmentId === selectedAptId && t.description.includes(formatMonthKey(selectedMonth)));
      
      let parsedDate = new Date();
      if (sheetDate && sheetDate.includes('.')) {
        const parts = sheetDate.split('.');
        if (parts.length >= 2) {
          const day = parts[0].trim().padStart(2, '0');
          const month = parts[1].trim().padStart(2, '0');
          const year = parts[2] ? parts[2].trim() : '2026';
          parsedDate = new Date(`${year}-${month}-${day}`);
        }
      }

      if (existingTIndex !== -1) {
        const updatedT = [...transactions];
        updatedT[existingTIndex] = {
          ...updatedT[existingTIndex],
          amount: paidAmountVal,
          description: transactionDesc,
          date: parsedDate
        };
        setTransactions(updatedT);
      } else {
        const newT = {
          id: Math.random().toString(),
          apartmentId: selectedAptId || 'apt_elitkent_b',
          type: 'income' as const,
          amount: paidAmountVal,
          description: transactionDesc,
          date: parsedDate,
          residentId: sheetResId
        };
        setTransactions([...transactions, newT]);
      }
    } else {
      setTransactions(transactions.filter(t => !(t.residentId === sheetResId && t.apartmentId === selectedAptId && t.description.includes(formatMonthKey(selectedMonth)))));
    }

    setIsSheetEditModalOpen(false);
  };

  const handleOpenNewPeriod = () => {
    const latestMonth = availableMonths[availableMonths.length - 1];
    const nextMonth = getNextMonthKey(latestMonth);
    
    if (availableMonths.includes(nextMonth)) {
      alert(`${formatMonthKey(nextMonth)} dönemi zaten açık.`);
      return;
    }

    if (!confirm(`${formatMonthKey(latestMonth)} dönemini kapatıp, kalan borç devirleriyle yeni ${formatMonthKey(nextMonth)} dönemini açmak istiyor musunuz?`)) {
      return;
    }

    const updatedResidents = residents.map(r => {
      let prevDebtForNextMonth = 0;
      let defaultDues = 430;
      
      const mRec = r.monthlyData?.[latestMonth];
      if (mRec) {
        prevDebtForNextMonth = (mRec.dues || 0) + (mRec.previousDebt || 0) + (mRec.gasDelay || 0) + (mRec.gasOther || 0) - (mRec.paidAmount || 0);
        defaultDues = mRec.dues || r.dues || 430;
      } else {
        prevDebtForNextMonth = r.previousDebt || (r.balance < 0 ? -r.balance : 0);
        defaultDues = r.dues || 430;
      }

      const nextMonthRecord = {
        dues: defaultDues,
        previousDebt: prevDebtForNextMonth,
        gasDelay: 0,
        gasOther: 0,
        paidAmount: 0,
        paymentChannel: '',
        paymentDate: ''
      };

      return {
        ...r,
        monthlyData: {
          ...(r.monthlyData || {}),
          [nextMonth]: nextMonthRecord
        }
      };
    });

    setResidents(updatedResidents);
    setAvailableMonths([...availableMonths, nextMonth]);
    setSelectedMonth(nextMonth);
    alert(`Yeni dönem (${formatMonthKey(nextMonth)}) başarıyla açıldı ve devreden borçlar yansıtıldı!`);
  };

  const handleExportSheetExcel = () => {
    if (!selectedAptId) return;
    const apt = apartments.find(a => a.id === selectedAptId);
    if (!apt) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    csvContent += `Muhasebe Defteri: ${apt.name}\r\n`;
    csvContent += `Dönem: ${formatMonthKey(selectedMonth)}\r\n`;
    csvContent += `Tarih: ${format(new Date(), 'dd.MM.yyyy')}\r\n\r\n`;

    csvContent += "DAIRE NO;ADI SOYADI;AIDAT;ESKI BORC;DOGALGAZ GECIKMESI;DOGALGAZ DIGER GIDER;TOPLAM;ODENEN;KALAN;ODEME KANALI;ODEME TARIHI\r\n";
    
    const sorted = [...residents.filter(r => r.apartmentId === selectedAptId)].sort((a,b) => {
      const aNum = parseInt(a.aptNo) || 0;
      const bNum = parseInt(b.aptNo) || 0;
      return aNum - bNum;
    });

    sorted.forEach(r => {
      const mRec = r.monthlyData?.[selectedMonth];
      const dues = mRec ? (mRec.dues || 0) : (r.dues || 0);
      const prev = mRec ? (mRec.previousDebt || 0) : (r.previousDebt || 0);
      const delay = mRec ? (mRec.gasDelay || 0) : (r.gasDelay || 0);
      const other = mRec ? (mRec.gasOther || 0) : (r.gasOther || 0);
      const total = dues + prev + delay + other;
      const paid = mRec ? (mRec.paidAmount || 0) : (r.paidAmount || 0);
      const remaining = total - paid;
      const channel = mRec ? (mRec.paymentChannel || '') : (r.paymentChannel || '');
      const date = mRec ? (mRec.paymentDate || '') : (r.paymentDate || '');
      
      csvContent += `${r.aptNo};${r.name};₺${dues};₺${prev};₺${delay};₺${other};₺${total};₺${paid};₺${remaining};${channel};${date}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${apt.name.replace(/ /g, "_")}_${selectedMonth}_muhasebe_defteri.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            const currentMonthData = r.monthlyData?.[selectedMonth] || {
              dues: r.dues || 0,
              previousDebt: r.previousDebt || 0,
              gasDelay: r.gasDelay || 0,
              gasOther: r.gasOther || 0,
              paidAmount: r.paidAmount || 0,
              paymentChannel: r.paymentChannel || '',
              paymentDate: r.paymentDate || ''
            };
            
            let updatedMonthRecord;
            if (debtType === 'aidat_kiraci') {
              updatedMonthRecord = {
                ...currentMonthData,
                dues: (currentMonthData.dues || 0) + finalAmount
              };
            } else {
              updatedMonthRecord = {
                ...currentMonthData,
                gasOther: (currentMonthData.gasOther || 0) + finalAmount
              };
            }

            return {
              ...r,
              balance: r.balance - finalAmount,
              dues: updatedMonthRecord.dues,
              gasOther: updatedMonthRecord.gasOther,
              monthlyData: {
                ...(r.monthlyData || {}),
                [selectedMonth]: updatedMonthRecord
              }
            };
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

  const renderBuildingSelection = () => {
    const compIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const compPersExpense = transactions.filter(t => t.type === 'personnel_expense').reduce((sum, t) => sum + t.amount, 0);
    const compOtherExpense = transactions.filter(t => t.type === 'other_expense').reduce((sum, t) => sum + t.amount, 0);
    const compExpense = compPersExpense + compOtherExpense;
    const compBalance = compIncome - compExpense;

    const bldIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const bldExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const outstandingDebt = residents.filter(r => r.balance < 0).reduce((sum, r) => sum + Math.abs(r.balance), 0);

    const activeTickets = tickets.filter(t => t.status !== 'Çözüldü');
    const activePolls = polls.filter(p => p.active);

    return (
      <div style={{ padding: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AtibayCRM Genel Yönetim Konsolu</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Şirket kasa hareketleri, binalar, aktif anketler ve arıza talepleri genel özeti.</p>
          </div>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsBuildingModalOpen(true)}>
            <Plus size={18} /> Yeni Bina Ekle
          </button>
        </div>

        {/* Şirket Kasa & Cari Durumu */}
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: 'var(--accent-color)' }}>Şirketim & Kasa Durumu</h2>
        <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
          <div className="glass-panel stat-card income">
            <h3>Şirket Toplam Hasılatı</h3>
            <div className="value">₺{compIncome.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Binalardan toplanan toplam aidatlar</div>
          </div>
          <div className="glass-panel stat-card expense">
            <h3>Toplam Şirket Giderleri</h3>
            <div className="value">₺{compExpense.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Personel maaş ve diğer genel giderler</div>
          </div>
          <div className="glass-panel stat-card balance" style={{
            background: compBalance >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
          }}>
            <h3>Net Bakiye (Kâr / Zarar)</h3>
            <div className="value" style={{ color: compBalance >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
              ₺{compBalance.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Şirket cari hesabı</div>
          </div>
        </div>

        {/* Binalar Finansal Özet */}
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: 'var(--success-color)' }}>Tüm Binalar Finansal Durumu</h2>
        <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
          <div className="glass-panel stat-card income">
            <h3>Toplanan Toplam Aidat</h3>
            <div className="value">₺{bldIncome.toLocaleString()}</div>
          </div>
          <div className="glass-panel stat-card expense">
            <h3>Toplam Bina Giderleri</h3>
            <div className="value">₺{bldExpense.toLocaleString()}</div>
          </div>
          <div className="glass-panel stat-card balance" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <h3>Sakin Toplam Borç Stoğu</h3>
            <div className="value" style={{ color: 'var(--warning-color)' }}>
              ₺{outstandingDebt.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', alignItems: 'start' }}>
          {/* Sol Kolon: Binalar Kartları */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Yönetilen Binalar ({apartments.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {apartments.map(apt => {
                const residentsInApt = residents.filter(r => r.apartmentId === apt.id);
                const duesCollected = transactions.filter(t => t.apartmentId === apt.id && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const bldExp = transactions.filter(t => t.apartmentId === apt.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                const aptBalance = duesCollected - bldExp;
                const outstanding = residentsInApt.filter(r => r.balance < 0).reduce((sum, r) => sum + Math.abs(r.balance), 0);

                return (
                  <div 
                    key={apt.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '24px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-color)', marginBottom: '8px' }}>{apt.name}</h3>
                      <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <div>Daire Sayısı: <strong style={{ color: 'var(--text-primary)' }}>{residentsInApt.length}</strong></div>
                        <div>Aylık Aidat: <strong style={{ color: 'var(--text-primary)' }}>₺{apt.duesAmount}</strong></div>
                        <div>Bina Bakiyesi: <strong style={{ color: aptBalance >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>₺{aptBalance.toLocaleString()}</strong></div>
                        <div>Bekleyen Alacak: <strong style={{ color: 'var(--warning-color)' }}>₺{outstanding.toLocaleString()}</strong></div>
                      </div>
                    </div>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                      onClick={() => { setSelectedAptId(apt.id); setActiveTab('dashboard'); }}
                    >
                      Bina Detayına Git
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sağ Kolon: Olaylar, Arızalar ve Anketler */}
          <div>
            {/* Aktif Arızalar */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Aktif Arızalar & Talepler</span>
                <span className="badge badge-danger" style={{ fontSize: '11px' }}>{activeTickets.length} Bekleyen</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto' }}>
                {activeTickets.map(t => {
                  const aptName = getAptName(t.apartmentId);
                  return (
                    <div key={t.id} style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('tickets')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{t.title}</span>
                        <span className={`badge ${t.priority === 'Yüksek' ? 'badge-danger' : t.priority === 'Orta' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '10px', padding: '2px 4px' }}>{t.priority}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{aptName} • Durum: <strong style={{ color: 'var(--warning-color)' }}>{t.status}</strong></div>
                    </div>
                  );
                })}
                {activeTickets.length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>Aktif arıza talebi bulunmuyor.</div>
                )}
              </div>
            </div>

            {/* Aktif Anket Sonuçları */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Aktif Anketlerin Durumu</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '280px', overflowY: 'auto' }}>
                {activePolls.map(p => {
                  const totalVotes = Object.keys(p.votes || {}).length;
                  
                  // Calculate options count
                  const optCounts: Record<string, number> = {};
                  p.options.forEach(o => { optCounts[o] = 0; });
                  Object.values(p.votes || {}).forEach(v => {
                    if (optCounts[v] !== undefined) optCounts[v]++;
                  });

                  return (
                    <div key={p.id} style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '12px' }}>
                      <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '8px' }}>{p.question}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Toplam Oy: {totalVotes}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {p.options.map(opt => {
                          const count = optCounts[opt] || 0;
                          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                          return (
                            <div key={opt} style={{ fontSize: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span>{opt}</span>
                                <strong>%{pct} ({count} oy)</strong>
                              </div>
                              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '3px' }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {activePolls.length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>Aktif anket bulunmuyor.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Genel Durum - {selectedAptId ? getAptName(selectedAptId) : ''}</h2>
        <div style={{ display: 'flex', gap: '12px' }} className="no-print">
          <button className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleExportExcel}>
            <Download size={18} /> Excel Rapor İndir
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--warning-color)' }} onClick={handlePrintPDF}>
            <Printer size={18} /> PDF Raporu Al
          </button>
        </div>
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
            {(activeTab === 'personnel' || activeTab === 'other_expenses' || activeTab === 'ledgers' || activeTab === 'import') && (
               <button className="btn-secondary" style={{ width: '100%', fontSize: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => { setSelectedAptId(null); setActiveTab('dashboard'); }}>
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
            <button className={`nav-item ${activeTab === 'sheet' ? 'active' : ''}`} onClick={() => setActiveTab('sheet')}>
              <Grid size={20} />
              <span>Muhasebe Defteri</span>
            </button>
            <button className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
              <Bell size={20} />
              <span>Duyurular</span>
            </button>
            <div style={{ margin: '16px 0', borderBottom: '1px solid var(--border-card)' }}></div>
          </>
        )}
 
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', paddingLeft: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Genel Yönetim</div>
        <button className={`nav-item ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
          <FileText size={20} />
          <span>Arızalar & Talepler</span>
        </button>
        <button className={`nav-item ${activeTab === 'personnel' ? 'active' : ''}`} onClick={() => setActiveTab('personnel')}>
          <Briefcase size={20} />
          <span>Personeller</span>
        </button>
        <button className={`nav-item ${activeTab === 'other_expenses' ? 'active' : ''}`} onClick={() => setActiveTab('other_expenses')}>
          <Wallet size={20} />
          <span>Diğer Giderler</span>
        </button>
        <button className={`nav-item ${activeTab === 'ledgers' ? 'active' : ''}`} onClick={() => setActiveTab('ledgers')}>
          <Activity size={20} />
          <span>Cari Kasa</span>
        </button>
        <button className={`nav-item ${activeTab === 'import' ? 'active' : ''}`} onClick={() => { setImportStep(1); setImportRawText(''); setActiveTab('import'); }}>
          <Upload size={20} />
          <span>Excel Veri Aktarımı</span>
        </button>
        
        <div style={{ margin: '16px 0', borderBottom: '1px solid var(--border-card)' }}></div>
        <button 
          className="nav-item" 
          onClick={handleResetToDefaults} 
          style={{ 
            color: '#f87171', 
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <RotateCcw size={20} />
          <span>Verileri Sıfırla</span>
        </button>
      </div>
 
      {/* Main Content */}
      <div className="main-content">
        {!selectedAptId && activeTab !== 'personnel' && activeTab !== 'other_expenses' && activeTab !== 'ledgers' && activeTab !== 'import' && activeTab !== 'tickets' && renderBuildingSelection()}
        
        {selectedAptId && activeTab === 'dashboard' && renderDashboard()}

        {/* GELİRLER TAB */}
        {activeTab === 'income' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Gelir Yönetimi</h2>
              <button className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => openIncomeModal()}>
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
                    <th style={{ width: '120px', textAlign: 'center' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t => t.type === 'income').map(t => (
                    <tr key={t.id}>
                      <td>{format(t.date, 'dd MMM yyyy')}</td>
                      <td>{t.description}</td>
                      <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>₺{t.amount.toLocaleString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => openIncomeModal(t)} style={{ background: 'transparent', color: 'var(--accent-color)', marginRight: '12px' }} title="Düzenle"><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteTransaction(t.id)} style={{ background: 'transparent', color: 'var(--danger-color)' }} title="Sil"><Trash2 size={18} /></button>
                      </td>
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
              <button className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => openExpenseModal()}>
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
                    <th style={{ width: '120px', textAlign: 'center' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t => t.type === 'expense').map(t => (
                    <tr key={t.id}>
                      <td>{format(t.date, 'dd MMM yyyy')}</td>
                      <td>{t.description}</td>
                      <td><button style={{background: 'transparent', color: 'var(--accent-color)'}}><FileText size={18} /></button></td>
                      <td style={{ color: 'var(--danger-color)', fontWeight: 600 }}>₺{t.amount.toLocaleString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => openExpenseModal(t)} style={{ background: 'transparent', color: 'var(--accent-color)', marginRight: '12px' }} title="Düzenle"><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteTransaction(t.id)} style={{ background: 'transparent', color: 'var(--danger-color)' }} title="Sil"><Trash2 size={18} /></button>
                      </td>
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
                 <button className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setSelectedAptIdForFuel(selectedAptId || apartments[0]?.id || ''); setIsFuelExpenseModalOpen(true); }}>
                    <Upload size={18} /> Yakıt Gideri (Excel)
                 </button>
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
                      <td style={{ fontWeight: 600 }}>Daire {r.aptNo}</td>
                      <td style={{ fontWeight: 500 }}>{r.name}</td>
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
                        <span style={{ 
                          fontWeight: 600,
                          color: r.balance < 0 ? 'var(--danger-color)' : 'var(--success-color)' 
                        }}>
                          {r.balance < 0 ? `Borçlu (₺${Math.abs(r.balance).toLocaleString()})` : 'Temiz / Alacaklı'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => { setSelectedResidentId(r.id); setIsResidentDetailModalOpen(true); }}
                          style={{ background: 'transparent', color: 'var(--success-color)', marginRight: '12px' }}
                          title="Sakin Hesap Detayları ve Tahsilat"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => openResidentModal(r)}
                          style={{ background: 'transparent', color: 'var(--accent-color)' }}
                          title="Düzenle"
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

        {/* MUHASEBE DEFTERI TAB */}
        {activeTab === 'sheet' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Muhasebe Defteri</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  Bina sakinlerinin tüm aidat, doğalgaz ısınma borçlanmaları ve tahsilat dökümünü içeren detaylı cari takip çizelgesi.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                  <label htmlFor="periodSelect" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 0, whiteSpace: 'nowrap' }}>Aktif Dönem:</label>
                  <select
                    id="periodSelect"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontSize: '14px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m} style={{ background: '#1e1b4b', color: '#fff' }}>{formatMonthKey(m)}</option>
                    ))}
                  </select>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleOpenNewPeriod}>
                  <Plus size={18} /> Yeni Dönem Aç
                </button>
                <button className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleExportSheetExcel}>
                  <Download size={18} /> Excel Olarak İndir
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Daire no veya sakin adı ile ara..." 
                value={sheetSearch}
                onChange={(e) => setSheetSearch(e.target.value)}
                style={{ maxWidth: '350px', marginBottom: 0 }}
              />
            </div>

            <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
              <table style={{ fontSize: '13px', minWidth: '1100px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Daire No</th>
                    <th>Adı Soyadı</th>
                    <th>Rol</th>
                    <th style={{ textAlign: 'right' }}>Aidat</th>
                    <th style={{ textAlign: 'right' }}>Eski Borç</th>
                    <th style={{ textAlign: 'right' }}>Doğalgaz Gecikme</th>
                    <th style={{ textAlign: 'right' }}>Doğalgaz Diğer</th>
                    <th style={{ textAlign: 'right', background: 'rgba(255,255,255,0.02)' }}>Toplam</th>
                    <th style={{ textAlign: 'right', color: 'var(--success-color)' }}>Ödenen</th>
                    <th style={{ textAlign: 'right', background: 'rgba(255,255,255,0.02)', fontWeight: 'bold' }}>Kalan</th>
                    <th>Ödeme Kanalı</th>
                    <th>Ödeme Tarihi</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sorted = [...residents.filter(r => r.apartmentId === selectedAptId && (r.name.toLowerCase().includes(sheetSearch.toLowerCase()) || r.aptNo.includes(sheetSearch)))].sort((a,b) => {
                      const aNum = parseInt(a.aptNo) || 0;
                      const bNum = parseInt(b.aptNo) || 0;
                      return aNum - bNum;
                    });

                    let totalDues = 0;
                    let totalPrevDebt = 0;
                    let totalGasDelay = 0;
                    let totalGasOther = 0;
                    let totalSum = 0;
                    let totalPaid = 0;
                    let totalRemaining = 0;

                    const rows = sorted.map(r => {
                      const mRec = r.monthlyData?.[selectedMonth];
                      const dues = mRec ? (mRec.dues || 0) : (r.dues || 0);
                      const prev = mRec ? (mRec.previousDebt || 0) : (r.previousDebt || 0);
                      const delay = mRec ? (mRec.gasDelay || 0) : (r.gasDelay || 0);
                      const other = mRec ? (mRec.gasOther || 0) : (r.gasOther || 0);
                      const total = dues + prev + delay + other;
                      const paid = mRec ? (mRec.paidAmount || 0) : (r.paidAmount || 0);
                      const remaining = total - paid;
                      const channel = mRec ? (mRec.paymentChannel || '') : (r.paymentChannel || '');
                      const date = mRec ? (mRec.paymentDate || '') : (r.paymentDate || '');

                      totalDues += dues;
                      totalPrevDebt += prev;
                      totalGasDelay += delay;
                      totalGasOther += other;
                      totalSum += total;
                      totalPaid += paid;
                      totalRemaining += remaining;

                      return (
                        <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => openSheetEditModal(r)}>
                          <td style={{ fontWeight: 600 }}>Daire {r.aptNo}</td>
                          <td style={{ fontWeight: 500 }}>{r.name}</td>
                          <td>
                            <span style={{ 
                              fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                              background: r.type === 'ev_sahibi' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: r.type === 'ev_sahibi' ? 'var(--accent-color)' : 'var(--warning-color)'
                            }}>
                              {r.type === 'ev_sahibi' ? 'Ev Sahibi' : 'Kiracı'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>₺{dues.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ textAlign: 'right' }}>₺{prev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ textAlign: 'right' }}>₺{delay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ textAlign: 'right' }}>₺{other.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ textAlign: 'right', background: 'rgba(255,255,255,0.02)', fontWeight: 600 }}>
                            ₺{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--success-color)', fontWeight: 500 }}>
                            ₺{paid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td style={{ 
                            textAlign: 'right', 
                            background: 'rgba(255,255,255,0.02)', 
                            fontWeight: 'bold',
                            color: remaining > 0 ? 'var(--danger-color)' : remaining < 0 ? 'var(--success-color)' : 'var(--text-primary)'
                          }}>
                            ₺{remaining.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td>{channel || '-'}</td>
                          <td>{date || '-'}</td>
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => openSheetEditModal(r)}
                              style={{ background: 'transparent', color: 'var(--accent-color)', padding: '4px' }}
                              title="Defter Kaydını Düzenle"
                            >
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    });

                    return (
                      <>
                        {rows}
                        <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 'bold', borderTop: '2px solid var(--border-card)' }}>
                          <td colSpan={3}>TOPLAM</td>
                          <td style={{ textAlign: 'right' }}>₺{totalDues.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ textAlign: 'right' }}>₺{totalPrevDebt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ textAlign: 'right' }}>₺{totalGasDelay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ textAlign: 'right' }}>₺{totalGasOther.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)' }}>₺{totalSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ textAlign: 'right', color: 'var(--success-color)' }}>₺{totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', color: totalRemaining > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                            ₺{totalRemaining.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DUYURULAR & ANKETLER TAB */}
        {activeTab === 'announcements' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
                {/* Sol Taraf: Duyuru Gönderme */}
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Genel Duyurular</h2>
                  <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Mesaj İçeriği</label>
                    <textarea 
                      className="input-field" 
                      rows={4} 
                      placeholder="Sakinlere gönderilecek duyuruyu yazın..."
                    ></textarea>
                    
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', marginTop: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={sendPush} onChange={(e) => setSendPush(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                        <span>Mobil Bildirim (Push)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                        <span>WhatsApp Mesajı</span>
                      </label>
                    </div>

                    <button className="btn-primary" onClick={() => alert('Duyuru tüm sakinlere başarıyla gönderildi!')}>Duyuru Gönder</button>
                  </div>

                  {/* Anket Oluşturma */}
                  <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '20px' }}>Yeni Anket Oluştur</h2>
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>ANKET SORUSU</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Örn: Apartman kapısı şifresi ne zaman değiştirilsin?"
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                    />

                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>HEDEF BİNA / APARTMAN</label>
                    <select 
                      className="input-field" 
                      value={newPollTargetId} 
                      onChange={(e) => setNewPollTargetId(e.target.value)}
                      style={{ padding: '10px' }}
                    >
                      <option value="all">Tüm Binalar (Genel)</option>
                      {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>

                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>SEÇENEKLER</label>
                    {newPollOptions.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder={`Seçenek ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...newPollOptions];
                            newOpts[idx] = e.target.value;
                            setNewPollOptions(newOpts);
                          }}
                          style={{ marginBottom: '8px' }}
                        />
                        {idx >= 2 && (
                          <button 
                            onClick={() => setNewPollOptions(newPollOptions.filter((_, i) => i !== idx))}
                            style={{ background: 'transparent', color: 'var(--danger-color)', padding: '8px' }}
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    ))}
                    {newPollOptions.length < 5 && (
                      <button 
                        className="btn-secondary" 
                        onClick={handleAddPollOption} 
                        style={{ fontSize: '12px', padding: '6px 12px', marginBottom: '16px', display: 'block' }}
                      >
                        + Seçenek Ekle
                      </button>
                    )}

                    <button className="btn-success" style={{ width: '100%' }} onClick={handleSavePoll}>Anketi Yayınla</button>
                  </div>
                </div>

                {/* Sağ Taraf: Anket Listesi & Sonuçları */}
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Aktif Anketler & Sonuçlar</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {polls.map(p => {
                      const totalVotes = Object.keys(p.votes || {}).length;
                      const optCounts: Record<string, number> = {};
                      p.options.forEach(o => { optCounts[o] = 0; });
                      Object.values(p.votes || {}).forEach(v => {
                        if (optCounts[v] !== undefined) optCounts[v]++;
                      });

                      return (
                        <div key={p.id} className="glass-panel" style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span className={`badge ${p.active ? 'badge-success' : 'badge-danger'}`}>
                              {p.active ? 'Aktif / Yayında' : 'Kapalı'}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              Bina: {p.targetBuildingId === 'all' ? 'Tüm Binalar' : getAptName(p.targetBuildingId)}
                            </span>
                          </div>
                          
                          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{p.question}</h3>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Toplam Katılım: {totalVotes} Sakin</div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {p.options.map(opt => {
                              const count = optCounts[opt] || 0;
                              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                              return (
                                <div key={opt}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                    <span>{opt}</span>
                                    <strong>%{pct} ({count} Oy)</strong>
                                  </div>
                                  <div style={{ width: '100%', height: '8px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '4px' }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                              className="btn-secondary" 
                              onClick={() => handleTogglePoll(p.id)}
                              style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                            >
                              {p.active ? 'Anketi Kapat' : 'Anketi Aç'}
                            </button>
                            <button 
                              className="btn-danger" 
                              onClick={() => handleDeletePoll(p.id)}
                              style={{ flex: 1, fontSize: '12px', padding: '6px', background: 'var(--danger-color)' }}
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {polls.length === 0 && (
                      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Kayıtlı anket bulunmuyor. Sol taraftan hemen yeni bir anket oluşturabilirsiniz.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* ARIZALAR & TALEPLER TAB */}
        {activeTab === 'tickets' && (() => {
          const filteredTickets = filterBuildingId === 'all'
            ? tickets
            : tickets.filter(t => t.apartmentId === filterBuildingId);

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Arızalar, Talepler & İş Takibi</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                    Sakinlerin mobil uygulamadan bildirdiği teknik sorunların takibi, personele atanması ve durum güncellemeleri.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label htmlFor="bldTicketFilter" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Bina Filtresi:</label>
                  <select
                    id="bldTicketFilter"
                    className="input-field"
                    value={filterBuildingId}
                    onChange={(e) => setFilterBuildingId(e.target.value)}
                    style={{ padding: '8px 12px', width: '220px', marginBottom: 0 }}
                  >
                    <option value="all">Tüm Binalar</option>
                    {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
                <table style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>Tarih</th>
                      <th>Bina</th>
                      <th>Bildiren Daire</th>
                      <th>Konu / Başlık</th>
                      <th>Açıklama</th>
                      <th style={{ width: '100px' }}>Öncelik</th>
                      <th style={{ width: '110px' }}>Durum</th>
                      <th style={{ width: '150px' }}>Atanan Personel</th>
                      <th>Çözüm / Notlar</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map(t => {
                      const isEditing = editingTicketId === t.id;
                      const staffName = staffs.find(s => s.id === t.assignedStaffId)?.name || 'Atanmadı';
                      const aptName = getAptName(t.apartmentId);

                      return (
                        <tr key={t.id}>
                          <td>{format(new Date(t.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                          <td style={{ fontWeight: 600 }}>{aptName}</td>
                          <td>{getResidentName(t.residentId)} (Daire {getResidentAptNo(t.residentId)})</td>
                          <td style={{ fontWeight: 500 }}>{t.title}</td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px' }}>{t.description}</td>
                          <td>
                            <span className={`badge ${t.priority === 'Yüksek' ? 'badge-danger' : t.priority === 'Orta' ? 'badge-warning' : 'badge-info'}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td>
                            {isEditing ? (
                              <select 
                                className="input-field" 
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as any)}
                                style={{ padding: '6px', fontSize: '12px', marginBottom: 0 }}
                              >
                                <option value="Açık">Açık</option>
                                <option value="İşlemde">İşlemde</option>
                                <option value="Çözüldü">Çözüldü</option>
                              </select>
                            ) : (
                              <span className={`badge ${t.status === 'Çözüldü' ? 'badge-success' : t.status === 'İşlemde' ? 'badge-warning' : 'badge-danger'}`}>
                                {t.status}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <select 
                                className="input-field" 
                                value={editStaffId || ''}
                                onChange={(e) => setEditStaffId(e.target.value || null)}
                                style={{ padding: '6px', fontSize: '12px', marginBottom: 0 }}
                              >
                                <option value="">Atanmadı</option>
                                {staffs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                              </select>
                            ) : (
                              <span style={{ fontWeight: 500 }}>{staffName}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input 
                                type="text"
                                className="input-field"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Çözüm notu..."
                                style={{ padding: '6px', fontSize: '12px', marginBottom: 0 }}
                              />
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.resolutionNotes || '-'}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn-success" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => handleSaveTicket(t.id)}>Kaydet</button>
                                <button className="btn-primary" style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--text-secondary)' }} onClick={() => setEditingTicketId(null)}>İptal</button>
                              </div>
                            ) : (
                              <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleStartEdit(t)}>Düzenle</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                          Arıza veya talep kaydı bulunmuyor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* PERSONEL TAB */}
        {activeTab === 'personnel' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 600 }}>Personel & Hakediş Yönetimi</h2>
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
                    <th>Sabit Maaş</th>
                    <th>Hakediş Bakiyesi (Kalan Alacak)</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {staffs.map(s => {
                    const jobsForStaff = staffJobs.filter(j => j.staffId === s.id);
                    const totalJobsEarned = jobsForStaff.reduce((sum, j) => sum + j.amount, 0);
                    const totalPaymentsMade = transactions.filter(t => t.type === 'personnel_expense' && t.staffId === s.id).reduce((sum, t) => sum + t.amount, 0);
                    const remainingBalance = totalJobsEarned - totalPaymentsMade;

                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500 }}>{s.name}</td>
                        <td><span className="badge badge-info">{s.role}</span></td>
                        <td>{s.phone}</td>
                        <td>₺{s.salary.toLocaleString()}</td>
                        <td style={{ fontWeight: 600, color: remainingBalance > 0 ? 'var(--success-color)' : 'var(--text-primary)' }}>
                          ₺{remainingBalance.toLocaleString()}
                        </td>
                        <td>
                          <button 
                            className="btn-success" 
                            style={{ padding: '6px 12px', fontSize: '12px', marginRight: '6px' }}
                            onClick={() => { setSelectedStaffIdForJob(s.id); setIsAddStaffJobModalOpen(true); }}
                          >
                            Hakediş Ekle
                          </button>
                          <button 
                            className="btn-danger" 
                            style={{ padding: '6px 12px', fontSize: '12px', marginRight: '6px' }}
                            onClick={() => { setSelectedStaffIdForPayment(s.id); setIsStaffPaymentModalOpen(true); }}
                          >
                            Ödeme Yap
                          </button>
                          <button onClick={() => openStaffModal(s)} style={{ background: 'transparent', color: 'var(--accent-color)', marginRight: '8px' }}><Edit2 size={18} /></button>
                          <button onClick={() => handleDeleteStaff(s.id)} style={{ background: 'transparent', color: 'var(--danger-color)' }}><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {staffs.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Kayıtlı personel bulunmuyor.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Görev Kayıtları ve Ödemeler Dökümü */}
            <div className="dashboard-grid">
              {/* YAPILAN GÖREVLER (HAKEDİŞLER) */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Yapılan İşlerin Kaydı (Hakediş Dökümü)</h3>
                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Personel</th>
                        <th>Bina</th>
                        <th>Görev</th>
                        <th>Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffJobs.map(sj => (
                        <tr key={sj.id}>
                          <td>{format(sj.date, 'dd.MM.yyyy')}</td>
                          <td style={{ fontWeight: 500 }}>{staffs.find(s => s.id === sj.staffId)?.name || 'Bilinmiyor'}</td>
                          <td>{apartments.find(a => a.id === sj.buildingId)?.name || 'Genel'}</td>
                          <td><span className="badge badge-warning">{sj.jobType}</span></td>
                          <td style={{ fontWeight: 600, color: 'var(--success-color)' }}>₺{sj.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      {staffJobs.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Kayıtlı görev bulunmuyor.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PERSONEL ÖDEMELERİ */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Ödenen Ücretler (Gider Kayıtları)</h3>
                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Personel</th>
                        <th>Açıklama</th>
                        <th>Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.filter(t => t.type === 'personnel_expense').map(t => (
                        <tr key={t.id}>
                          <td>{format(t.date, 'dd.MM.yyyy')}</td>
                          <td style={{ fontWeight: 500 }}>{staffs.find(s => s.id === t.staffId)?.name || 'Bilinmiyor'}</td>
                          <td>{t.description}</td>
                          <td style={{ fontWeight: 600, color: 'var(--danger-color)' }}>₺{t.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      {transactions.filter(t => t.type === 'personnel_expense').length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Ödeme kaydı bulunmuyor.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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

        {/* CARI KASA (LEDGERS) TAB */}
        {activeTab === 'ledgers' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Cari Kasa Yönetimi</h2>

            {/* Şirket Kasası Durumu */}
            <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
              <div className="glass-panel stat-card income">
                <h3>Şirket Toplam Hasılatı</h3>
                <div className="value">₺{transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Binalardan tahsil edilen toplam aidat gelirleri</div>
              </div>
              <div className="glass-panel stat-card expense">
                <h3>Toplam Şirket Gideri</h3>
                <div className="value">₺{(
                  transactions.filter(t => t.type === 'personnel_expense').reduce((sum, t) => sum + t.amount, 0) +
                  transactions.filter(t => t.type === 'other_expense').reduce((sum, t) => sum + t.amount, 0)
                ).toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Personel ödemeleri ve genel giderler</div>
              </div>
              <div className="glass-panel stat-card balance" style={{
                background: (
                  transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                  (transactions.filter(t => t.type === 'personnel_expense').reduce((sum, t) => sum + t.amount, 0) +
                   transactions.filter(t => t.type === 'other_expense').reduce((sum, t) => sum + t.amount, 0))
                ) >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
              }}>
                <h3>Şirket Cari Bakiyesi (Kâr / Zarar)</h3>
                <div className="value" style={{
                  color: (
                    transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                    (transactions.filter(t => t.type === 'personnel_expense').reduce((sum, t) => sum + t.amount, 0) +
                     transactions.filter(t => t.type === 'other_expense').reduce((sum, t) => sum + t.amount, 0))
                  ) >= 0 ? 'var(--success-color)' : 'var(--danger-color)'
                }}>₺{(
                  transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                  (transactions.filter(t => t.type === 'personnel_expense').reduce((sum, t) => sum + t.amount, 0) +
                   transactions.filter(t => t.type === 'other_expense').reduce((sum, t) => sum + t.amount, 0))
                ).toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Şirket net kâr/zarar bilançosu</div>
              </div>
            </div>

            {/* Bina Bazlı Cari Kasalar */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600 }}>Bina Cari Hesapları</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Bina Adı</th>
                      <th>Toplam Toplanan Aidat</th>
                      <th>Toplam Bina Gideri</th>
                      <th>Cari Kasa Bakiyesi</th>
                      <th>Bekleyen Toplam Borç</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apartments.map(apt => {
                      const duesColl = transactions.filter(t => t.apartmentId === apt.id && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                      const bExp = transactions.filter(t => t.apartmentId === apt.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                      const cBal = duesColl - bExp;
                      const outstanding = residents.filter(r => r.apartmentId === apt.id && r.balance < 0).reduce((sum, r) => sum + Math.abs(r.balance), 0);

                      return (
                        <tr key={apt.id}>
                          <td style={{ fontWeight: 600 }}>{apt.name}</td>
                          <td style={{ color: 'var(--success-color)' }}>₺{duesColl.toLocaleString()}</td>
                          <td style={{ color: 'var(--danger-color)' }}>₺{bExp.toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: cBal >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                            ₺{cBal.toLocaleString()}
                          </td>
                          <td style={{ color: 'var(--warning-color)' }}>₺{outstanding.toLocaleString()}</td>
                          <td>
                            <button 
                              className="btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => { setSelectedAptId(apt.id); setActiveTab('dashboard'); }}
                            >
                              Detayları Gör
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AKILLI EXCEL ITHALAT SIHIRBAZI (IMPORT WIZARD) TAB */}
        {activeTab === 'import' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Akıllı Excel / Sheets İçe Aktarma Sihirbazı</h2>
            
            {/* Step Wizard Header */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', justifyContent: 'space-between', border: '1px solid var(--border-card)' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', background: importStep === 1 ? 'rgba(59,130,246,0.15)' : 'transparent', borderLeft: importStep === 1 ? '3px solid var(--accent-color)' : 'none' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: importStep >= 1 ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Veri Kopyalama</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Excel/CSV verisini yapıştırın</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', background: importStep === 2 ? 'rgba(59,130,246,0.15)' : 'transparent', borderLeft: importStep === 2 ? '3px solid var(--accent-color)' : 'none' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: importStep >= 2 ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Sütun Eşleştirme</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Alanları kolonlarla eşleyin</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', background: importStep === 3 ? 'rgba(59,130,246,0.15)' : 'transparent', borderLeft: importStep === 3 ? '3px solid var(--accent-color)' : 'none' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: importStep >= 3 ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Önizleme & Onay</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Simülasyonu kontrol edip aktarın</div>
                </div>
              </div>
            </div>

            {/* STEP 1: VERI GIRISI */}
            {importStep === 1 && (
              <div className="glass-panel" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Adım 1: Excel veya Google Sheets Verilerinizi Kopyalayın</h3>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>İÇE AKTARMA TÜRÜ</label>
                  <select 
                    className="input-field" 
                    value={importType} 
                    onChange={(e) => setImportType(e.target.value as any)}
                    style={{ padding: '12px' }}
                  >
                    <option value="residents">Yeni Bina / Daire Sakin Listesi ve Bakiyeler</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Tablonuzdaki tüm verileri (Başlık satırı dahil) kopyalayıp (Ctrl+C) aşağıdaki alana yapıştırın (Ctrl+V):
                  </label>
                  <textarea 
                    className="input-field" 
                    rows={10} 
                    placeholder="Daire No&#9;Sakin Adi&#9;Telefon&#9;Tip&#9;Bakiye&#10;1&#9;Ahmet Yılmaz&#9;05551234567&#9;Kiracı&#9;500&#10;2&#9;Ayşe Kaya&#9;05321234567&#9;Ev Sahibi&#9;-300"
                    value={importRawText}
                    onChange={(e) => setImportRawText(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: '13px', background: 'rgba(15, 23, 42, 0.7)' }}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    💡 Excel kopyalaması otomatik olarak tab-ayrımlı (TSV) metin oluşturur. Çözümleyicimiz tüm yapıları akıllıca okur.
                  </div>
                </div>

                <button className="btn-primary" style={{ width: '100%' }} onClick={handleProcessImportRawText}>
                  Verileri Oku ve Eşleştirmeye Geç
                </button>
              </div>
            )}

            {/* STEP 2: SUTUN ESLERSTIRME */}
            {importStep === 2 && (
              <div className="glass-panel" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Adım 2: Tablo Sütunlarını Sistem Alanları ile Eşleştirin</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                  Yazılım, tablonuzun sütun başlıklarını okudu ve akıllı algoritmalarıyla olası eşleşmeleri otomatik seçti. Lütfen doğruluğundan emin olun:
                </p>

                {/* Bina Seçimi */}
                <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-card)' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--accent-color)', marginBottom: '8px' }}>HEDEF BİNA / APARTMAN</label>
                  <select 
                    className="input-field" 
                    value={importTargetBuildingId} 
                    onChange={(e) => setImportTargetBuildingId(e.target.value)}
                    style={{ padding: '12px' }}
                  >
                    {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Seçilen Excel verileri bu binaya aktarılacaktır.</div>
                </div>

                {/* Sütun Listesi Eşleştirmeleri */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>DAİRE NUMARASI *</label>
                    <select 
                      className="input-field"
                      value={importMapping['aptNo'] !== undefined ? importMapping['aptNo'] : ''}
                      onChange={(e) => setImportMapping({ ...importMapping, aptNo: parseInt(e.target.value) })}
                      style={{ padding: '10px' }}
                    >
                      <option value="">-- Seçiniz --</option>
                      {importHeaders.map((h, idx) => <option key={idx} value={idx}>Sütun {idx + 1}: {h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>SAKİN ADI & SOYADI *</label>
                    <select 
                      className="input-field"
                      value={importMapping['name'] !== undefined ? importMapping['name'] : ''}
                      onChange={(e) => setImportMapping({ ...importMapping, name: parseInt(e.target.value) })}
                      style={{ padding: '10px' }}
                    >
                      <option value="">-- Seçiniz --</option>
                      {importHeaders.map((h, idx) => <option key={idx} value={idx}>Sütun {idx + 1}: {h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>TELEFON NUMARASI (İsteğe Bağlı)</label>
                    <select 
                      className="input-field"
                      value={importMapping['phone'] !== undefined ? importMapping['phone'] : ''}
                      onChange={(e) => setImportMapping({ ...importMapping, phone: parseInt(e.target.value) })}
                      style={{ padding: '10px' }}
                    >
                      <option value="">-- Atla / Yok --</option>
                      {importHeaders.map((h, idx) => <option key={idx} value={idx}>Sütun {idx + 1}: {h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>ROLÜ / SAKİN TİPİ (Ev Sahibi / Kiracı - İsteğe Bağlı)</label>
                    <select 
                      className="input-field"
                      value={importMapping['type'] !== undefined ? importMapping['type'] : ''}
                      onChange={(e) => setImportMapping({ ...importMapping, type: parseInt(e.target.value) })}
                      style={{ padding: '10px' }}
                    >
                      <option value="">-- Atla (Varsayılan Kiracı) --</option>
                      {importHeaders.map((h, idx) => <option key={idx} value={idx}>Sütun {idx + 1}: {h}</option>)}
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--warning-color)', marginBottom: '6px' }}>GÜNCEL HESAP BAKİYESİ / BORÇ (İsteğe Bağlı)</label>
                    <select 
                      className="input-field"
                      value={importMapping['balance'] !== undefined ? importMapping['balance'] : ''}
                      onChange={(e) => setImportMapping({ ...importMapping, balance: parseInt(e.target.value) })}
                      style={{ padding: '10px' }}
                    >
                      <option value="">-- Atla (Varsayılan 0 ₺) --</option>
                      {importHeaders.map((h, idx) => <option key={idx} value={idx}>Sütun {idx + 1}: {h}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }} onClick={() => setImportStep(1)}>
                    Geri Dön
                  </button>
                  <button className="btn-primary" style={{ flex: 2 }} onClick={handleGenerateImportPreview}>
                    Önizlemeyi İncele ve Doğrula
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW & FINISH */}
            {importStep === 3 && (
              <div className="glass-panel" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Adım 3: Aktarılacak Veri Önizlemesi ve Simülasyonu</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                  Verileriniz sistemle eşleştirildi. Yeni sakinler sisteme eklenecek, daire numarası aynı olan mevcut sakinlerin ise kartları güncellenecektir:
                </p>

                <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-card)', borderRadius: '12px', marginBottom: '32px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Daire No</th>
                        <th>Sakin Adı</th>
                        <th>Telefon</th>
                        <th>Rol</th>
                        <th>Eklenecek Başlangıç Borcu</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreviewList.map(item => (
                        <tr key={item.key} style={{ background: item.exists ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                          <td style={{ fontWeight: 600 }}>{item.aptNo}</td>
                          <td style={{ fontWeight: 500 }}>{item.name}</td>
                          <td>{item.phone}</td>
                          <td>
                            <span className={`badge ${item.type === 'ev_sahibi' ? 'badge-info' : 'badge-warning'}`}>
                              {item.type === 'ev_sahibi' ? 'Ev Sahibi' : 'Kiracı'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: item.balance < 0 ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                            ₺{Math.abs(item.balance).toLocaleString()}
                          </td>
                          <td>
                            <span className={`badge ${item.exists ? 'badge-warning' : 'badge-success'}`}>
                              {item.exists ? 'Mevcut (Güncellenecek)' : 'Yeni Daire (Sisteme Eklenecek)'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }} onClick={() => setImportStep(2)}>
                    Geri Dön
                  </button>
                  <button className="btn-success" style={{ flex: 2 }} onClick={handleExecuteImport}>
                    Sisteme Kaydet ve İçe Aktarmayı Tamamla
                  </button>
                </div>
              </div>
            )}
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
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>{editingTransactionId ? 'Geliri Düzenle' : 'Yeni Gelir Ekle'}</h3>
              <button className="close-btn" onClick={() => { setIsIncomeModalOpen(false); setEditingTransactionId(null); setDescription(''); setAmount(''); }}><X size={24} /></button>
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
              {editingTransactionId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>{editingTransactionId ? 'Gideri Düzenle' : 'Yeni Gider/Fatura Ekle'}</h3>
              <button className="close-btn" onClick={() => { setIsExpenseModalOpen(false); setEditingTransactionId(null); setDescription(''); setAmount(''); }}><X size={24} /></button>
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
              {editingTransactionId ? 'Güncelle' : 'Kaydet'}
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

      {/* Muhasebe Defteri Hızlı Hücre Düzenleme Modalı */}
      {isSheetEditModalOpen && (() => {
        const resident = residents.find(r => r.id === sheetResId);
        if (!resident) return null;
        return (
          <div className="modal-overlay">
            <div className="glass-panel modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3 style={{ fontSize: '20px' }}>Daire {resident.aptNo} - Muhasebe Defteri Kaydı</h3>
                <button className="close-btn" onClick={() => setIsSheetEditModalOpen(false)}><X size={24} /></button>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                <strong>{resident.name}</strong> isimli sakine ait tüm muhasebe değerlerini düzenleyin.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '12px' }}>Aylık Sabit Aidat (₺)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Aidat"
                    value={sheetDues}
                    onChange={(e) => setSheetDues(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '12px' }}>Eski Borç Devri (₺)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Eski Borç"
                    value={sheetPrevDebt}
                    onChange={(e) => setSheetPrevDebt(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '12px' }}>Doğalgaz Gecikme Bedeli (₺)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Gecikme Bedeli"
                    value={sheetGasDelay}
                    onChange={(e) => setSheetGasDelay(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '12px' }}>Doğalgaz Isınma/Diğer (₺)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Diğer Gider"
                    value={sheetGasOther}
                    onChange={(e) => setSheetGasOther(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-card)', margin: '16px 0', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)' }}>Ödeme & Tahsilat Bilgileri</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '12px' }}>Yapılan Ödeme / Ödenen (₺)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="Ödenen Miktar"
                      value={sheetPaidAmount}
                      onChange={(e) => setSheetPaidAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '12px' }}>Ödeme Tarihi</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Örn: 16.01.2026"
                      value={sheetDate}
                      onChange={(e) => setSheetDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '12px' }}>Ödeme Kanalı (Açıklama)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Örn: BANKA, GELİR FİŞİ 16"
                    value={sheetChannel}
                    onChange={(e) => setSheetChannel(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsSheetEditModalOpen(false)}>İptal</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveSheetResident}>Kayıt Değişikliklerini Uygula</button>
              </div>
            </div>
          </div>
        );
      })()}

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
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
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
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
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

      {/* Resident Detail Modal */}
      {isResidentDetailModalOpen && (() => {
        const resident = residents.find(r => r.id === selectedResidentId);
        if (!resident) return null;
        const residentApt = apartments.find(a => a.id === resident.apartmentId);
        
        // Find resident transactions
        const residentTrans = transactions.filter(t => t.residentId === resident.id);

        return (
          <div className="modal-overlay">
            <div className="glass-panel modal-content" style={{ maxWidth: '700px', width: '90%' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 600 }}>Sakin Hesap Kartı ve Cari Detayı</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    className="btn-primary" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      padding: '6px 12px', 
                      fontSize: '13px', 
                      background: 'var(--warning-color)',
                    }} 
                    onClick={() => handlePrintResidentPDF(resident, residentApt)}
                  >
                    <Printer size={16} />
                    Yazdır / PDF
                  </button>
                  <button className="close-btn" onClick={() => { setIsResidentDetailModalOpen(false); setSelectedResidentId(null); }}><X size={24} /></button>
                </div>
              </div>

              {/* Sakin Künyesi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SAKİN ADI</div>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>{resident.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>BAĞLI BİNA / DAİRE</div>
                  <div style={{ fontWeight: 600 }}>{residentApt?.name || 'Bilinmiyor'} - Daire {resident.aptNo}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TELEFON</div>
                  <div>{resident.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ROLÜ</div>
                  <div>
                    <span className={`badge ${resident.type === 'ev_sahibi' ? 'badge-info' : 'badge-warning'}`}>
                      {resident.type === 'ev_sahibi' ? 'Ev Sahibi' : 'Kiracı'}
                    </span>
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-card)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>GÜNCEL HESAP BAKİYESİ</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: resident.balance < 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                    {resident.balance < 0 ? `Borç: ₺${Math.abs(resident.balance).toLocaleString()}` : `Alacak: ₺${resident.balance.toLocaleString()}`}
                  </div>
                </div>
              </div>

              {/* Cari İşlemler (Tahsilat & Borçlandırma Panelleri) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Hızlı Tahsilat Al */}
                <div style={{ borderRight: '1px solid var(--border-card)', paddingRight: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--success-color)' }}>Tahsilat Yap (Ödeme Al)</h4>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Tahsilat Tutarı (₺)" 
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    style={{ padding: '8px 12px', marginBottom: '8px' }}
                  />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ödeme Açıklaması (Örn: Aidat)" 
                    value={paymentDesc}
                    onChange={(e) => setPaymentDesc(e.target.value)}
                    style={{ padding: '8px 12px', marginBottom: '12px' }}
                  />
                  <button className="btn-success" style={{ width: '100%', padding: '8px', fontSize: '13px' }} onClick={() => handleResidentPayment(resident.id)}>
                    Tahsilatı Kaydet
                  </button>
                </div>

                {/* Münferit Borçlandır */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--danger-color)' }}>Münferit Borç Ekle</h4>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Borç Tutarı (₺)" 
                    value={debitAmountSingle}
                    onChange={(e) => setDebitAmountSingle(e.target.value)}
                    style={{ padding: '8px 12px', marginBottom: '8px' }}
                  />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Borç Açıklaması (Örn: Demirbaş)" 
                    value={debitDescSingle}
                    onChange={(e) => setDebitDescSingle(e.target.value)}
                    style={{ padding: '8px 12px', marginBottom: '12px' }}
                  />
                  <button className="btn-danger" style={{ width: '100%', padding: '8px', fontSize: '13px' }} onClick={() => handleResidentDebit(resident.id)}>
                    Borç Ekle
                  </button>
                </div>
              </div>

              {/* Geçmiş Hareketler Listesi */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>Geçmiş Hesap Hareketleri</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-card)', borderRadius: '8px' }}>
                  <table style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Açıklama</th>
                        <th>Tür</th>
                        <th>Tutar</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residentTrans.map(t => (
                        <tr key={t.id}>
                          <td>{format(t.date, 'dd.MM.yyyy')}</td>
                          <td>{t.description}</td>
                          <td>
                            <span className={`badge ${t.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                              {t.type === 'income' ? 'Tahsilat' : 'Gider/Borç'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>₺{t.amount.toLocaleString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => {
                                  if (t.type === 'income') {
                                    openIncomeModal(t);
                                  } else if (t.type === 'expense') {
                                    openExpenseModal(t);
                                  } else if (t.type === 'personnel_expense') {
                                    openTransactionModal('personnel_expense', t);
                                  } else if (t.type === 'other_expense') {
                                    openTransactionModal('other_expense', t);
                                  }
                                }} 
                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0 }} 
                                title="Düzenle"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(t.id)} 
                                style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: 0 }} 
                                title="Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {residentTrans.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Ödeme hareketi bulunmuyor.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Staff Job Modal */}
      {isAddStaffJobModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>Hakediş / Görev Ekle</h3>
              <button className="close-btn" onClick={() => setIsAddStaffJobModalOpen(false)}><X size={24} /></button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>BİNA SEÇİNİZ</label>
              <select 
                className="input-field" 
                value={jobBuildingId} 
                onChange={(e) => setJobBuildingId(e.target.value)}
                style={{ padding: '10px' }}
              >
                {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>YAPILACAK İŞ / GÖREV</label>
              <select 
                className="input-field" 
                value={jobTypeName} 
                onChange={(e) => {
                  const selected = predefinedJobs.find(pj => pj.name === e.target.value);
                  if (selected) {
                    setJobTypeName(selected.name);
                    setJobAmount(selected.defaultAmount.toString());
                  }
                }}
                style={{ padding: '10px' }}
              >
                {predefinedJobs.map(pj => <option key={pj.id} value={pj.name}>{pj.name} (₺{pj.defaultAmount})</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>HAKEDİŞ TUTARI (₺)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="Tutar (₺)" 
                value={jobAmount}
                onChange={(e) => setJobAmount(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>EKSTRA AÇIKLAMA</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="İş detayı, açıklama..." 
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>

            <button className="btn-success" style={{ width: '100%' }} onClick={handleSaveStaffJob}>
              Görevi Kaydet ve Hakediş Yansıt
            </button>
          </div>
        </div>
      )}

      {/* Staff Payment Modal */}
      {isStaffPaymentModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px' }}>Personele Ödeme Yap</h3>
              <button className="close-btn" onClick={() => setIsStaffPaymentModalOpen(false)}><X size={24} /></button>
            </div>

            <input 
              type="number" 
              className="input-field" 
              placeholder="Ödenen Tutar (₺)" 
              value={paymentToStaffAmount}
              onChange={(e) => setPaymentToStaffAmount(e.target.value)}
            />

            <input 
              type="text" 
              className="input-field" 
              placeholder="Ödeme Açıklaması (Örn: Mayıs Maaşı)" 
              value={paymentToStaffDesc}
              onChange={(e) => setPaymentToStaffDesc(e.target.value)}
            />

            <button className="btn-danger" style={{ width: '100%' }} onClick={handleSaveStaffPayment}>
              Ödemeyi Tamamla ve Gider Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Fuel Expense Excel Upload Modal */}
      {isFuelExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '650px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Yakıt Gideri Excel Paylaştırma</h3>
              <button className="close-btn" onClick={() => { setIsFuelExpenseModalOpen(false); setFuelPreviewList([]); }}><X size={24} /></button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>İŞLEM YAPILACAK BİNA</label>
              <select 
                className="input-field" 
                value={selectedAptIdForFuel} 
                onChange={(e) => {
                  setSelectedAptIdForFuel(e.target.value);
                  setFuelPreviewList([]);
                }}
                style={{ padding: '10px' }}
              >
                {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Okuma firmasından gelen yakıt tablosunu Excel'den kopyalayıp aşağıdaki alana yapıştırın (Örn: Daire No ve Tutar kolonları):
              </label>
              <textarea 
                className="input-field paste-area" 
                rows={5}
                placeholder="1&#9;150.50&#10;2&#9;230.10&#10;3&#9;180.00"
                value={fuelExcelText}
                onChange={(e) => setFuelExcelText(e.target.value)}
              />
              <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px', marginBottom: '12px' }} onClick={handleParseFuelExcel}>
                Listeyi Çözümle ve Önizle
              </button>
            </div>

            {/* Önizleme Listesi */}
            {fuelPreviewList.length > 0 && (
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Borçlandırma Önizleme Simülasyonu</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-card)', borderRadius: '8px', marginBottom: '16px' }}>
                  <table style={{ fontSize: '12px' }} className="preview-table">
                    <thead>
                      <tr>
                        <th>Daire</th>
                        <th>Eşleşen Sakin</th>
                        <th>Eklenecek Yakıt Borcu</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelPreviewList.map((p, idx) => (
                        <tr key={idx} style={{ background: p.found ? 'transparent' : 'rgba(239, 68, 68, 0.05)' }}>
                          <td style={{ fontWeight: 600 }}>{p.aptNo}</td>
                          <td>{p.name}</td>
                          <td style={{ fontWeight: 600, color: 'var(--danger-color)' }}>₺{p.amount.toLocaleString()}</td>
                          <td>
                            <span className={`badge ${p.found ? 'badge-success' : 'badge-danger'}`}>
                              {p.found ? 'Eşleşti' : 'Bulunamadı'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>TOPLAM OKUMA FATURASI TUTARI (Gider olarak yazılacak - İsteğe Bağlı)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Toplam Fatura Tutarı (₺)" 
                    value={fuelTotalInvoice}
                    onChange={(e) => setFuelTotalInvoice(e.target.value)}
                    style={{ padding: '8px 12px' }}
                  />
                </div>

                <button className="btn-danger" style={{ width: '100%' }} onClick={handleApplyFuelExpense}>
                  Borçlandırmayı Onayla ve Hesaplara Yansıt
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
