import type { BeforeOrAfterMatchup } from '../types/game';

/**
 * Before or After? — which one came first.
 *
 * Source of truth for V1. `correct` names the movie released first. The
 * display order of `a` and `b` is shuffled at runtime so authoring order
 * never gives the answer away.
 */
export const beforeOrAfterMatchups: readonly BeforeOrAfterMatchup[] = [
  { id: 'boa-001', a: { title: 'Athadu', year: 2005 }, b: { title: 'Pokiri', year: 2006 }, correct: 'a' },
  { id: 'boa-002', a: { title: 'Okkadu', year: 2003 }, b: { title: 'Athadu', year: 2005 }, correct: 'a' },
  { id: 'boa-003', a: { title: 'Pokiri', year: 2006 }, b: { title: 'Jalsa', year: 2008 }, correct: 'a' },
  { id: 'boa-004', a: { title: 'Jalsa', year: 2008 }, b: { title: 'Magadheera', year: 2009 }, correct: 'a' },
  { id: 'boa-005', a: { title: 'Magadheera', year: 2009 }, b: { title: 'Darling', year: 2010 }, correct: 'a' },
  { id: 'boa-006', a: { title: 'Darling', year: 2010 }, b: { title: 'Mr. Perfect', year: 2011 }, correct: 'a' },
  { id: 'boa-007', a: { title: 'Dookudu', year: 2011 }, b: { title: 'Businessman', year: 2012 }, correct: 'a' },
  { id: 'boa-008', a: { title: 'Businessman', year: 2012 }, b: { title: 'Gabbar Singh', year: 2012 }, correct: 'a' },
  { id: 'boa-009', a: { title: 'Gabbar Singh', year: 2012 }, b: { title: 'Eega', year: 2012 }, correct: 'a' },
  { id: 'boa-010', a: { title: 'Eega', year: 2012 }, b: { title: 'Attarintiki Daredi', year: 2013 }, correct: 'a' },
  { id: 'boa-011', a: { title: 'Mirchi', year: 2013 }, b: { title: 'Race Gurram', year: 2014 }, correct: 'a' },
  { id: 'boa-012', a: { title: 'Race Gurram', year: 2014 }, b: { title: 'Baahubali', year: 2015 }, correct: 'a' },
  { id: 'boa-013', a: { title: 'Srimanthudu', year: 2015 }, b: { title: 'Nannaku Prematho', year: 2016 }, correct: 'a' },
  { id: 'boa-014', a: { title: 'Nannaku Prematho', year: 2016 }, b: { title: 'Janatha Garage', year: 2016 }, correct: 'a' },
  { id: 'boa-015', a: { title: 'Janatha Garage', year: 2016 }, b: { title: 'Arjun Reddy', year: 2017 }, correct: 'a' },
  { id: 'boa-016', a: { title: 'Baahubali 2', year: 2017 }, b: { title: 'Arjun Reddy', year: 2017 }, correct: 'a' },
  { id: 'boa-017', a: { title: 'Arjun Reddy', year: 2017 }, b: { title: 'Rangasthalam', year: 2018 }, correct: 'a' },
  { id: 'boa-018', a: { title: 'Rangasthalam', year: 2018 }, b: { title: 'Geetha Govindam', year: 2018 }, correct: 'a' },
  { id: 'boa-019', a: { title: 'Geetha Govindam', year: 2018 }, b: { title: 'Jersey', year: 2019 }, correct: 'a' },
  { id: 'boa-020', a: { title: 'Jersey', year: 2019 }, b: { title: 'Ala Vaikunthapurramuloo', year: 2020 }, correct: 'a' },
  { id: 'boa-021', a: { title: 'Ala Vaikunthapurramuloo', year: 2020 }, b: { title: 'Pushpa', year: 2021 }, correct: 'a' },
  { id: 'boa-022', a: { title: 'Pushpa', year: 2021 }, b: { title: 'RRR', year: 2022 }, correct: 'a' },
  { id: 'boa-023', a: { title: 'RRR', year: 2022 }, b: { title: 'Sita Ramam', year: 2022 }, correct: 'a' },
  { id: 'boa-024', a: { title: 'Sita Ramam', year: 2022 }, b: { title: 'Karthikeya 2', year: 2022 }, correct: 'a' },
  { id: 'boa-025', a: { title: 'Karthikeya 2', year: 2022 }, b: { title: 'Dasara', year: 2023 }, correct: 'a' },
  { id: 'boa-026', a: { title: 'Dasara', year: 2023 }, b: { title: 'Baby', year: 2023 }, correct: 'a' },
  { id: 'boa-027', a: { title: 'Baby', year: 2023 }, b: { title: 'Salaar', year: 2023 }, correct: 'a' },
  { id: 'boa-028', a: { title: 'Salaar', year: 2023 }, b: { title: 'Guntur Kaaram', year: 2024 }, correct: 'a' },
  { id: 'boa-029', a: { title: 'Guntur Kaaram', year: 2024 }, b: { title: 'Kalki 2898 AD', year: 2024 }, correct: 'a' },
  { id: 'boa-030', a: { title: 'Kalki 2898 AD', year: 2024 }, b: { title: 'Pushpa 2', year: 2024 }, correct: 'a' },
];
