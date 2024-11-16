import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Payment } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
    paddingBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 5,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 20,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 35,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#1A1A1A',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 8,
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    color: '#4B5563',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  status: {
    padding: 4,
    borderRadius: 4,
    fontSize: 10,
    textAlign: 'center',
  },
  statusPaid: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
});

interface PaymentHistoryPDFProps {
  payments: Payment[];
  playerName: string;
  stats: {
    totalPaid: number;
    monthlyTotal: number;
    tournamentTotal: number;
    pendingTotal: number;
  };
}

const formatMoney = (amount: number) => 
  new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP',
    maximumFractionDigits: 0 
  }).format(amount);

const PaymentHistoryPDF = ({ payments, playerName, stats }: PaymentHistoryPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDMtMTZUMTI6MzQ6NDctMDM6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMTZUMTI6MzQ6NDctMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAzLTE2VDEyOjM0OjQ3LTAzOjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM1OTM1LTU0ZDItNDZiZi1hMzA2LTNmOWZjNzA1NzA0YiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjY5ZDM1OTM1LTU0ZDItNDZiZi1h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"
          style={styles.logo}
        />
        <View>
          <Text style={styles.title}>Pudaweed Soccer Team</Text>
          <Text style={styles.subtitle}>Historial de Pagos - {playerName}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Pagado</Text>
          <Text style={styles.summaryValue}>{formatMoney(stats.totalPaid)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Mensualidades</Text>
          <Text style={styles.summaryValue}>{formatMoney(stats.monthlyTotal)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Campeonatos</Text>
          <Text style={styles.summaryValue}>{formatMoney(stats.tournamentTotal)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pendiente</Text>
          <Text style={styles.summaryValue}>{formatMoney(stats.pendingTotal)}</Text>
        </View>
      </View>

      {/* Payments Table */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableHeaderCell}>Fecha</Text>
          <Text style={styles.tableHeaderCell}>Tipo</Text>
          <Text style={styles.tableHeaderCell}>Método</Text>
          <Text style={styles.tableHeaderCell}>Monto</Text>
          <Text style={styles.tableHeaderCell}>Estado</Text>
        </View>

        {payments.map((payment, index) => (
          <View key={index} style={[styles.tableRow, index % 2 === 0 ? { backgroundColor: '#F9FAFB' } : {}]}>
            <Text style={styles.tableCell}>
              {format(payment.date, 'dd/MM/yyyy', { locale: es })}
            </Text>
            <Text style={styles.tableCell}>
              {payment.type === 'monthly' ? 'Mensualidad' : 'Campeonato'}
            </Text>
            <Text style={styles.tableCell}>
              {payment.method === 'cash' ? 'Efectivo' : 'Transferencia'}
            </Text>
            <Text style={styles.tableCell}>
              {formatMoney(payment.amount)}
            </Text>
            <Text style={[
              styles.tableCell,
              styles.status,
              payment.status === 'paid' ? styles.statusPaid : styles.statusPending
            ]}>
              {payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Generado el {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
      </Text>
    </Page>
  </Document>
);

export default PaymentHistoryPDF;