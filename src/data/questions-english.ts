import type { Question } from '../types/game'

/**
 * English Language Question Bank — 50 questions
 * Categories: vocabulary, grammar, spelling, reading
 * Level: Primary School (Grade 1-6)
 */
export const englishQuestionBank: Question[] = [
  // --- Vocabulary — 13 Questions ---
  { id: 'en-v1', equation: 'What is "แมว" in English?', subject: 'English', category: 'vocabulary', choices: ['Dog', 'Cat', 'Bird', 'Fish'], answerIndex: 1 },
  { id: 'en-v2', equation: 'What is "โรงเรียน" in English?', subject: 'English', category: 'vocabulary', choices: ['Hospital', 'Market', 'School', 'Temple'], answerIndex: 2 },
  { id: 'en-v3', equation: 'What color is the sky?', subject: 'English', category: 'vocabulary', choices: ['Red', 'Green', 'Blue', 'Yellow'], answerIndex: 2 },
  { id: 'en-v4', equation: '"Apple" คือผลไม้อะไร?', subject: 'English', category: 'vocabulary', choices: ['กล้วย', 'แอปเปิ้ล', 'ส้ม', 'มะม่วง'], answerIndex: 1 },
  { id: 'en-v5', equation: 'How many days are in a week?', subject: 'English', category: 'vocabulary', choices: ['5', '6', '7', '8'], answerIndex: 2 },
  { id: 'en-v6', equation: 'What is "น้ำ" in English?', subject: 'English', category: 'vocabulary', choices: ['Fire', 'Water', 'Wind', 'Earth'], answerIndex: 1 },
  { id: 'en-v7', equation: '"Teacher" means...', subject: 'English', category: 'vocabulary', choices: ['นักเรียน', 'ครู', 'หมอ', 'ตำรวจ'], answerIndex: 1 },
  { id: 'en-v8', equation: 'What is "ดวงอาทิตย์" in English?', subject: 'English', category: 'vocabulary', choices: ['Moon', 'Star', 'Sun', 'Cloud'], answerIndex: 2 },
  { id: 'en-v9', equation: '"Elephant" is a...', subject: 'English', category: 'vocabulary', choices: ['Small animal', 'Big animal', 'Sea animal', 'Flying animal'], answerIndex: 1 },
  { id: 'en-v10', equation: 'What is the opposite of "hot"?', subject: 'English', category: 'vocabulary', choices: ['Warm', 'Cold', 'Cool', 'Wet'], answerIndex: 1 },
  { id: 'en-v11', equation: '"Happy" means...', subject: 'English', category: 'vocabulary', choices: ['เศร้า', 'โกรธ', 'มีความสุข', 'เหนื่อย'], answerIndex: 2 },
  { id: 'en-v12', equation: 'What is "หนังสือ" in English?', subject: 'English', category: 'vocabulary', choices: ['Pencil', 'Book', 'Pen', 'Eraser'], answerIndex: 1 },
  { id: 'en-v13', equation: '"Breakfast" is eaten in the...', subject: 'English', category: 'vocabulary', choices: ['Morning', 'Afternoon', 'Evening', 'Night'], answerIndex: 0 },

  // --- Grammar — 13 Questions ---
  { id: 'en-g1', equation: 'She ___ a student.', subject: 'English', category: 'grammar', choices: ['am', 'is', 'are', 'be'], answerIndex: 1 },
  { id: 'en-g2', equation: 'They ___ playing football.', subject: 'English', category: 'grammar', choices: ['is', 'am', 'are', 'was'], answerIndex: 2 },
  { id: 'en-g3', equation: 'I ___ to school every day.', subject: 'English', category: 'grammar', choices: ['goes', 'go', 'going', 'gone'], answerIndex: 1 },
  { id: 'en-g4', equation: 'This is ___ apple.', subject: 'English', category: 'grammar', choices: ['a', 'an', 'the', 'is'], answerIndex: 1 },
  { id: 'en-g5', equation: 'He ___ breakfast at 7 AM.', subject: 'English', category: 'grammar', choices: ['eat', 'eats', 'eating', 'ate'], answerIndex: 1 },
  { id: 'en-g6', equation: '___ you like ice cream?', subject: 'English', category: 'grammar', choices: ['Do', 'Does', 'Is', 'Are'], answerIndex: 0 },
  { id: 'en-g7', equation: 'The cat is ___ the table.', subject: 'English', category: 'grammar', choices: ['in', 'on', 'at', 'to'], answerIndex: 1 },
  { id: 'en-g8', equation: 'She ___ not like snakes.', subject: 'English', category: 'grammar', choices: ['do', 'does', 'is', 'are'], answerIndex: 1 },
  { id: 'en-g9', equation: 'We ___ happy today.', subject: 'English', category: 'grammar', choices: ['is', 'am', 'are', 'be'], answerIndex: 2 },
  { id: 'en-g10', equation: '___ is your name?', subject: 'English', category: 'grammar', choices: ['Who', 'What', 'Where', 'When'], answerIndex: 1 },
  { id: 'en-g11', equation: 'I have two ___.', subject: 'English', category: 'grammar', choices: ['foot', 'foots', 'feet', 'feets'], answerIndex: 2 },
  { id: 'en-g12', equation: 'The children ___ playing.', subject: 'English', category: 'grammar', choices: ['is', 'am', 'are', 'was'], answerIndex: 2 },
  { id: 'en-g13', equation: 'My mother ___ cooking now.', subject: 'English', category: 'grammar', choices: ['is', 'are', 'am', 'be'], answerIndex: 0 },

  // --- Spelling — 12 Questions ---
  { id: 'en-s1', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['skool', 'schol', 'school', 'scool'], answerIndex: 2 },
  { id: 'en-s2', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['freind', 'friend', 'frend', 'frind'], answerIndex: 1 },
  { id: 'en-s3', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['beautful', 'beutiful', 'beautiful', 'beautifull'], answerIndex: 2 },
  { id: 'en-s4', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['becuase', 'becouse', 'becaus', 'because'], answerIndex: 3 },
  { id: 'en-s5', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['famly', 'family', 'famely', 'familly'], answerIndex: 1 },
  { id: 'en-s6', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['animel', 'anmal', 'animal', 'animale'], answerIndex: 2 },
  { id: 'en-s7', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['togather', 'togheter', 'together', 'togeter'], answerIndex: 2 },
  { id: 'en-s8', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['importent', 'important', 'importnt', 'importtant'], answerIndex: 1 },
  { id: 'en-s9', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['countri', 'contry', 'country', 'cuntry'], answerIndex: 2 },
  { id: 'en-s10', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['diffrent', 'diferent', 'different', 'differnt'], answerIndex: 2 },
  { id: 'en-s11', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['vegtable', 'vegetable', 'vegitable', 'vegetble'], answerIndex: 1 },
  { id: 'en-s12', equation: 'Which spelling is correct?', subject: 'English', category: 'spelling', choices: ['wensday', 'wendesday', 'Wednesday', 'Wednseday'], answerIndex: 2 },

  // --- Reading — 12 Questions ---
  { id: 'en-r1', equation: '"The dog is big." What is big?', subject: 'English', category: 'reading', choices: ['The cat', 'The dog', 'The bird', 'The fish'], answerIndex: 1 },
  { id: 'en-r2', equation: '"I eat rice for lunch." When do I eat rice?', subject: 'English', category: 'reading', choices: ['Breakfast', 'Lunch', 'Dinner', 'Snack'], answerIndex: 1 },
  { id: 'en-r3', equation: '"She goes to school by bus." How does she go?', subject: 'English', category: 'reading', choices: ['By car', 'By bus', 'By boat', 'On foot'], answerIndex: 1 },
  { id: 'en-r4', equation: '"Tom has three cats." How many cats?', subject: 'English', category: 'reading', choices: ['1', '2', '3', '4'], answerIndex: 2 },
  { id: 'en-r5', equation: '"It is raining today." What is the weather?', subject: 'English', category: 'reading', choices: ['Sunny', 'Cloudy', 'Rainy', 'Windy'], answerIndex: 2 },
  { id: 'en-r6', equation: '"My favorite fruit is mango." What fruit?', subject: 'English', category: 'reading', choices: ['Apple', 'Banana', 'Mango', 'Orange'], answerIndex: 2 },
  { id: 'en-r7', equation: '"The baby is sleeping." What is the baby doing?', subject: 'English', category: 'reading', choices: ['Eating', 'Playing', 'Sleeping', 'Crying'], answerIndex: 2 },
  { id: 'en-r8', equation: '"We live in Thailand." Where do we live?', subject: 'English', category: 'reading', choices: ['Japan', 'China', 'Thailand', 'Korea'], answerIndex: 2 },
  { id: 'en-r9', equation: '"Father is cooking." Who is cooking?', subject: 'English', category: 'reading', choices: ['Mother', 'Father', 'Sister', 'Brother'], answerIndex: 1 },
  { id: 'en-r10', equation: '"The flower is red." What color is it?', subject: 'English', category: 'reading', choices: ['Blue', 'Green', 'Red', 'Yellow'], answerIndex: 2 },
  { id: 'en-r11', equation: '"She is 8 years old." How old is she?', subject: 'English', category: 'reading', choices: ['6', '7', '8', '9'], answerIndex: 2 },
  { id: 'en-r12', equation: '"They play in the park." Where do they play?', subject: 'English', category: 'reading', choices: ['At home', 'At school', 'In the park', 'On the road'], answerIndex: 2 },
]
