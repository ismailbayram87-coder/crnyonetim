import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'home' | 'announcements' | 'receipts' | 'gas';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const buildingName = "Güneş Apartmanı";
  const myBalance = -1250; // Aidat + Doğalgaz borcu örneği
  
  const transactions = [
    { id: 1, type: 'gider', amount: 1200, date: '05 Mayıs 2026', title: 'Asansör Bakımı' },
    { id: 2, type: 'gider', amount: 350, date: '01 Mayıs 2026', title: 'Ortak Elektrik' },
    { id: 3, type: 'gider', amount: 800, date: '28 Nisan 2026', title: 'Temizlik Gideri' },
  ];

  const announcements = [
    { id: 1, date: '10 Mayıs 2026', title: 'Asansör Bakımı Hakkında', content: 'Asansörümüz 12 Mayıs günü saat 10:00-14:00 arası bakıma alınacaktır.' },
    { id: 2, date: '01 Mayıs 2026', title: 'Aidat Ödemeleri', content: 'Lütfen aidat ödemelerinizi ayın 15\'ine kadar yapınız.' },
  ];

  const receipts = [
    { id: 1, title: 'Nisan Ayı Elektrik', date: '01 Mayıs 2026', image: 'https://via.placeholder.com/400x600.png?text=Elektrik+Faturasi' },
    { id: 2, title: 'Nisan Ayı Su', date: '02 Mayıs 2026', image: 'https://via.placeholder.com/400x600.png?text=Su+Faturasi' },
  ];

  const gasDocuments = [
    { id: 1, title: 'Mayıs 2026 Doğalgaz Paylaşımı', type: 'excel', date: '05 Mayıs 2026', size: '24 KB' },
    { id: 2, title: 'Nisan 2026 Doğalgaz Paylaşımı', type: 'pdf', date: '05 Nisan 2026', size: '1.2 MB' },
    { id: 3, title: 'Mart 2026 Doğalgaz Paylaşımı', type: 'excel', date: '05 Mart 2026', size: '23 KB' },
  ];

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

            <Text style={styles.sectionTitle}>{buildingName} - Son Giderler</Text>
            {transactions.map(t => (
              <View key={t.id} style={styles.listItem}>
                <View style={styles.listIcon}>
                  <Ionicons name="arrow-up-circle" size={28} color="#ff6b6b" />
                </View>
                <View style={styles.listBody}>
                  <Text style={styles.listTitle}>{t.title}</Text>
                  <Text style={styles.listSubtitle}>{t.date}</Text>
                </View>
                <Text style={styles.listAmount}>{t.amount} ₺</Text>
              </View>
            ))}
          </ScrollView>
        );
      case 'announcements':
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Yönetim Duyuruları</Text>
            {announcements.map(a => (
              <View key={a.id} style={styles.announcementCard}>
                <Text style={styles.announcementDate}>{a.date}</Text>
                <Text style={styles.announcementTitle}>{a.title}</Text>
                <Text style={styles.announcementText}>{a.content}</Text>
              </View>
            ))}
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
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>{buildingName}</Text>
          <Text style={styles.headerTitle}>Daire 2 - Ayşe Kaya (Kiracı)</Text>
        </View>
        <Ionicons name="person-circle-outline" size={36} color="#fff" />
      </View>

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    fontSize: 16,
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
  },
  listIcon: {
    marginRight: 12,
  },
  listBody: {
    flex: 1,
  },
  listTitle: {
    color: '#f8fafc',
    fontSize: 16,
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
    paddingBottom: 24, // Safe area bottom
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#3b82f6',
  },
});
