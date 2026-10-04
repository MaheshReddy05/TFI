import type { WhatsCommonRound } from '../types/game';

/**
 * What's Common? — three clues, one connection.
 *
 * Source of truth for V1. To add rounds, append entries with a new unique id.
 */
export const whatsCommonRounds: readonly WhatsCommonRound[] = [
  { id: 'wc-001', clues: ['Athadu', 'Khaleja', 'Guntur Kaaram'], answer: 'Mahesh Babu + Trivikram' },
  { id: 'wc-002', clues: ['Pokiri', 'Businessman', 'Temper'], answer: 'Puri Jagannadh' },
  { id: 'wc-003', clues: ['Arya', '100% Love', 'Pushpa'], answer: 'Sukumar' },
  { id: 'wc-004', clues: ['Magadheera', 'Eega', 'RRR'], answer: 'S. S. Rajamouli' },
  { id: 'wc-005', clues: ['Jalsa', 'Attarintiki Daredi', 'Agnyaathavaasi'], answer: 'Pawan Kalyan + Trivikram' },
  { id: 'wc-006', clues: ['Julayi', 'S/O Satyamurthy', 'Ala Vaikunthapurramuloo'], answer: 'Allu Arjun + Trivikram' },
  { id: 'wc-007', clues: ['Nannaku Prematho', 'Rangasthalam', 'Pushpa'], answer: 'Sukumar' },
  { id: 'wc-008', clues: ['Simhadri', 'Yamadonga', 'RRR'], answer: 'Jr NTR + Rajamouli' },
  { id: 'wc-009', clues: ['Student No. 1', 'Simhadri', 'Yamadonga'], answer: 'Jr NTR + Rajamouli' },
  { id: 'wc-010', clues: ['Chatrapathi', 'Baahubali', 'Baahubali 2'], answer: 'Prabhas + Rajamouli' },
  { id: 'wc-011', clues: ['Okkadu', 'Arjun', 'Sainikudu'], answer: 'Mahesh Babu + Gunasekhar' },
  { id: 'wc-012', clues: ['Mirchi', 'Srimanthudu', 'Janatha Garage'], answer: 'Koratala Siva' },
  { id: 'wc-013', clues: ['Mirchi', 'Baahubali', 'Saaho'], answer: 'Prabhas' },
  { id: 'wc-014', clues: ['Arya', 'Julayi', 'Race Gurram'], answer: 'Allu Arjun' },
  { id: 'wc-015', clues: ['Okkadu', 'Athadu', 'Pokiri'], answer: 'Mahesh Babu' },
  { id: 'wc-016', clues: ['Kushi', 'Jalsa', 'Gabbar Singh'], answer: 'Pawan Kalyan' },
  { id: 'wc-017', clues: ['Temper', 'Nannaku Prematho', 'Aravinda Sametha'], answer: 'Jr NTR' },
  { id: 'wc-018', clues: ['Magadheera', 'Dhruva', 'Rangasthalam'], answer: 'Ram Charan' },
  { id: 'wc-019', clues: ['Pelli Choopulu', 'Arjun Reddy', 'Geetha Govindam'], answer: 'Vijay Deverakonda' },
  { id: 'wc-020', clues: ['Nuvvu Naaku Nachav', 'Malliswari', 'Aadavari Matalaku Arthale Verule'], answer: 'Venkatesh' },
  { id: 'wc-021', clues: ['Manmadhudu', 'Mass', 'King'], answer: 'Nagarjuna' },
  { id: 'wc-022', clues: ['Happy Days', 'Fidaa', 'Love Story'], answer: 'Sekhar Kammula' },
  { id: 'wc-023', clues: ['Bommarillu', 'Parugu', 'Orange'], answer: 'Bhaskar' },
  { id: 'wc-024', clues: ['Pelli Choopulu', 'Ee Nagaraniki Emaindi', 'Keeda Cola'], answer: 'Tharun Bhascker' },
  { id: 'wc-025', clues: ['Run Raja Run', 'Saaho', 'OG'], answer: 'Sujeeth' },
  { id: 'wc-026', clues: ['Ala Modalaindi', 'Kalyana Vaibhogame', 'Anni Manchi Sakunamule'], answer: 'Nandini Reddy' },
  { id: 'wc-027', clues: ['Awe!', 'Kalki', 'Zombie Reddy'], answer: 'Prasanth Varma' },
  { id: 'wc-028', clues: ['Leader', 'Fidaa', 'Love Story'], answer: 'Sekhar Kammula' },
  { id: 'wc-029', clues: ['Venkatadri Express', 'Express Raja', 'Mahanubhavudu'], answer: 'Sharwanand' },
  { id: 'wc-030', clues: ['Yevade Subramanyam', 'Mahanati', 'Kalki 2898 AD'], answer: 'Nag Ashwin' },
];
