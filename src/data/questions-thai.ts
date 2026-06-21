import type { Question } from '../types/game'

/**
 * Thai Language Question Bank — 50 questions
 * Categories: vowels (สระ), consonants (พยัญชนะ), reading (คำอ่าน), vocabulary (คำศัพท์)
 * Level: ประถมศึกษา (ป.1 - ป.6)
 */
export const thaiQuestionBank: Question[] = [
  // --- สระ (Vowels) — 13 Questions ---
  { id: 'th-v1', equation: 'สระ "อา" เขียนอย่างไร?', subject: 'Thai', category: 'vowels', choices: ['-ะ', '-า', '-ิ', '-ี'], answerIndex: 1 },
  { id: 'th-v2', equation: '"กา" มีสระอะไร?', subject: 'Thai', category: 'vowels', choices: ['สระ อะ', 'สระ อา', 'สระ อิ', 'สระ อู'], answerIndex: 1 },
  { id: 'th-v3', equation: 'สระ "อี" อยู่ตำแหน่งไหนของพยัญชนะ?', subject: 'Thai', category: 'vowels', choices: ['ข้างหน้า', 'ข้างบน', 'ข้างหลัง', 'ข้างล่าง'], answerIndex: 1 },
  { id: 'th-v4', equation: '"มือ" มีสระอะไร?', subject: 'Thai', category: 'vowels', choices: ['สระ อือ', 'สระ อู', 'สระ อี', 'สระ อุ'], answerIndex: 0 },
  { id: 'th-v5', equation: 'คำว่า "เด็ก" มีสระอะไร?', subject: 'Thai', category: 'vowels', choices: ['สระ เอะ', 'สระ แอ', 'สระ เอ', 'สระ อะ'], answerIndex: 0 },
  { id: 'th-v6', equation: '"ปู" มีสระอะไร?', subject: 'Thai', category: 'vowels', choices: ['สระ อิ', 'สระ อี', 'สระ อุ', 'สระ อู'], answerIndex: 3 },
  { id: 'th-v7', equation: 'สระ "แอ" เขียนอย่างไร?', subject: 'Thai', category: 'vowels', choices: ['เ-', 'แ-', 'ไ-', 'ใ-'], answerIndex: 1 },
  { id: 'th-v8', equation: '"โต๊ะ" มีสระอะไร?', subject: 'Thai', category: 'vowels', choices: ['สระ โอ', 'สระ โอะ', 'สระ อะ', 'สระ ออ'], answerIndex: 1 },
  { id: 'th-v9', equation: 'คำว่า "ไป" มีสระอะไร?', subject: 'Thai', category: 'vowels', choices: ['สระ ไอ', 'สระ ใอ', 'สระ อาย', 'สระ เอา'], answerIndex: 0 },
  { id: 'th-v10', equation: '"ใจ" มีสระอะไร?', subject: 'Thai', category: 'vowels', choices: ['สระ ไอ', 'สระ ใอ', 'สระ อาย', 'สระ เอา'], answerIndex: 1 },
  { id: 'th-v11', equation: 'สระตัวไหนเป็นสระเสียงยาว?', subject: 'Thai', category: 'vowels', choices: ['อะ', 'อิ', 'อา', 'อุ'], answerIndex: 2 },
  { id: 'th-v12', equation: '"เสือ" มีสระอะไร?', subject: 'Thai', category: 'vowels', choices: ['สระ เอือ', 'สระ เอ', 'สระ อือ', 'สระ เอีย'], answerIndex: 0 },
  { id: 'th-v13', equation: 'สระเสียงสั้นของ "อา" คือ?', subject: 'Thai', category: 'vowels', choices: ['อิ', 'อะ', 'อุ', 'เอะ'], answerIndex: 1 },

  // --- พยัญชนะ (Consonants) — 13 Questions ---
  { id: 'th-c1', equation: 'พยัญชนะไทยมีทั้งหมดกี่ตัว?', subject: 'Thai', category: 'consonants', choices: ['42', '44', '46', '48'], answerIndex: 1 },
  { id: 'th-c2', equation: '"ก ไก่" เป็นอักษรหมู่ไหน?', subject: 'Thai', category: 'consonants', choices: ['อักษรสูง', 'อักษรกลาง', 'อักษรต่ำ', 'อักษรพิเศษ'], answerIndex: 1 },
  { id: 'th-c3', equation: 'ข้อใดเป็นอักษรสูงทั้งหมด?', subject: 'Thai', category: 'consonants', choices: ['ข ฃ ค', 'ข ฃ ฉ', 'ก ข ค', 'จ ฉ ช'], answerIndex: 1 },
  { id: 'th-c4', equation: '"ง งู" เป็นอักษรหมู่ไหน?', subject: 'Thai', category: 'consonants', choices: ['อักษรสูง', 'อักษรกลาง', 'อักษรต่ำ', 'อักษรพิเศษ'], answerIndex: 2 },
  { id: 'th-c5', equation: 'พยัญชนะตัวสุดท้ายคือตัวอะไร?', subject: 'Thai', category: 'consonants', choices: ['ฮ นกฮูก', 'อ อ่าง', 'ห หีบ', 'ฬ จุฬา'], answerIndex: 0 },
  { id: 'th-c6', equation: 'อักษรกลางมีกี่ตัว?', subject: 'Thai', category: 'consonants', choices: ['7', '9', '11', '13'], answerIndex: 1 },
  { id: 'th-c7', equation: '"ช ช้าง" เป็นอักษรหมู่ไหน?', subject: 'Thai', category: 'consonants', choices: ['อักษรสูง', 'อักษรกลาง', 'อักษรต่ำ', 'ไม่ใช่อักษรจริง'], answerIndex: 2 },
  { id: 'th-c8', equation: 'ข้อใดเป็นอักษรกลางทั้งหมด?', subject: 'Thai', category: 'consonants', choices: ['ก จ ด', 'ก ข ค', 'จ ฉ ช', 'ด ต ถ'], answerIndex: 0 },
  { id: 'th-c9', equation: '"ฐ" อ่านว่าอะไร?', subject: 'Thai', category: 'consonants', choices: ['ฐ ฐาน', 'ต เต่า', 'ถ ถุง', 'ท ทหาร'], answerIndex: 0 },
  { id: 'th-c10', equation: 'พยัญชนะตัวแรกของภาษาไทยคือ?', subject: 'Thai', category: 'consonants', choices: ['ก ไก่', 'อ อ่าง', 'ข ไข่', 'จ จาน'], answerIndex: 0 },
  { id: 'th-c11', equation: '"ศ" อ่านว่าอะไร?', subject: 'Thai', category: 'consonants', choices: ['ศ ศาลา', 'ษ ฤๅษี', 'ส เสือ', 'ซ โซ่'], answerIndex: 0 },
  { id: 'th-c12', equation: 'อักษรต่ำมีกี่ตัว?', subject: 'Thai', category: 'consonants', choices: ['20', '24', '26', '22'], answerIndex: 1 },
  { id: 'th-c13', equation: '"ญ" อ่านว่าอะไร?', subject: 'Thai', category: 'consonants', choices: ['ญ หญิง', 'ย ยักษ์', 'อ อ่าง', 'ณ เณร'], answerIndex: 0 },

  // --- คำอ่าน (Reading) — 12 Questions ---
  { id: 'th-r1', equation: '"โรงเรียน" อ่านว่าอย่างไร?', subject: 'Thai', category: 'reading', choices: ['โรง-เรียน', 'โร-เรียน', 'โรง-เลียน', 'โรง-เรีย'], answerIndex: 0 },
  { id: 'th-r2', equation: '"สวัสดี" อ่านว่าอย่างไร?', subject: 'Thai', category: 'reading', choices: ['สะ-วัด-ดี', 'สะ-หวัด-ดี', 'สวัด-ดี', 'สวัส-ดี'], answerIndex: 0 },
  { id: 'th-r3', equation: '"ประเทศ" มีกี่พยางค์?', subject: 'Thai', category: 'reading', choices: ['2', '3', '4', '1'], answerIndex: 1 },
  { id: 'th-r4', equation: '"กระต่าย" อ่านว่าอย่างไร?', subject: 'Thai', category: 'reading', choices: ['กระ-ต่าย', 'กร-ต่าย', 'กระ-ตาย', 'กระ-ต่า'], answerIndex: 0 },
  { id: 'th-r5', equation: '"ขนมปัง" มีกี่พยางค์?', subject: 'Thai', category: 'reading', choices: ['2', '3', '4', '1'], answerIndex: 1 },
  { id: 'th-r6', equation: '"จักรยาน" อ่านว่าอย่างไร?', subject: 'Thai', category: 'reading', choices: ['จัก-กระ-ยาน', 'จัก-ยาน', 'จัก-ระ-ยาน', 'จั-กระ-ยาน'], answerIndex: 0 },
  { id: 'th-r7', equation: '"อาจารย์" อ่านว่าอย่างไร?', subject: 'Thai', category: 'reading', choices: ['อา-จาน', 'อา-จาย', 'อา-จา-ย์', 'อา-จารย์'], answerIndex: 0 },
  { id: 'th-r8', equation: '"ตำรวจ" มีกี่พยางค์?', subject: 'Thai', category: 'reading', choices: ['2', '3', '4', '1'], answerIndex: 1 },
  { id: 'th-r9', equation: '"ทหาร" อ่านว่าอย่างไร?', subject: 'Thai', category: 'reading', choices: ['ทะ-หาน', 'ทะ-หาร', 'ท-หาน', 'ทา-หาน'], answerIndex: 0 },
  { id: 'th-r10', equation: '"มนุษย์" อ่านว่าอย่างไร?', subject: 'Thai', category: 'reading', choices: ['มะ-นุด', 'ม-นุด', 'มะ-นุส', 'มะ-หนุด'], answerIndex: 0 },
  { id: 'th-r11', equation: '"ธรรมชาติ" มีกี่พยางค์?', subject: 'Thai', category: 'reading', choices: ['3', '4', '5', '2'], answerIndex: 1 },
  { id: 'th-r12', equation: '"พฤหัสบดี" อ่านว่าอย่างไร?', subject: 'Thai', category: 'reading', choices: ['พรึ-หัด-สะ-บอ-ดี', 'พะ-รึ-หัด-บอ-ดี', 'พรึ-หัด-บอ-ดี', 'พรึ-หัส-บอ-ดี'], answerIndex: 0 },

  // --- คำศัพท์ (Vocabulary) — 12 Questions ---
  { id: 'th-w1', equation: 'คำว่า "ผลไม้" หมายถึง?', subject: 'Thai', category: 'vocabulary', choices: ['ดอกไม้', 'อาหาร', 'ผลที่เกิดจากต้นไม้', 'ใบไม้'], answerIndex: 2 },
  { id: 'th-w2', equation: 'คำตรงข้ามของ "สูง" คือ?', subject: 'Thai', category: 'vocabulary', choices: ['ยาว', 'ใหญ่', 'เตี้ย', 'กว้าง'], answerIndex: 2 },
  { id: 'th-w3', equation: 'คำตรงข้ามของ "มืด" คือ?', subject: 'Thai', category: 'vocabulary', choices: ['ดำ', 'สว่าง', 'เย็น', 'ร้อน'], answerIndex: 1 },
  { id: 'th-w4', equation: '"ครู" หมายถึง?', subject: 'Thai', category: 'vocabulary', choices: ['คนขายของ', 'คนสอนหนังสือ', 'คนทำอาหาร', 'คนขับรถ'], answerIndex: 1 },
  { id: 'th-w5', equation: 'สัตว์ชนิดใดบินได้?', subject: 'Thai', category: 'vocabulary', choices: ['ปลา', 'แมว', 'นก', 'กบ'], answerIndex: 2 },
  { id: 'th-w6', equation: '"พจนานุกรม" ใช้ทำอะไร?', subject: 'Thai', category: 'vocabulary', choices: ['วาดรูป', 'ค้นหาความหมายของคำ', 'คำนวณเลข', 'เขียนจดหมาย'], answerIndex: 1 },
  { id: 'th-w7', equation: 'คำตรงข้ามของ "เร็ว" คือ?', subject: 'Thai', category: 'vocabulary', choices: ['ช้า', 'ไว', 'ดี', 'เก่ง'], answerIndex: 0 },
  { id: 'th-w8', equation: '"ฤดูฝน" มีฝนตกมากในช่วงเดือนไหน?', subject: 'Thai', category: 'vocabulary', choices: ['ม.ค. - มี.ค.', 'เม.ย. - มิ.ย.', 'ก.ค. - ก.ย.', 'ต.ค. - ธ.ค.'], answerIndex: 2 },
  { id: 'th-w9', equation: 'คำว่า "ขยัน" มีความหมายว่า?', subject: 'Thai', category: 'vocabulary', choices: ['ทำงานหนัก', 'ทำงานน้อย', 'ไม่ทำงาน', 'ทำงานผิด'], answerIndex: 0 },
  { id: 'th-w10', equation: 'คำตรงข้ามของ "ร้อน" คือ?', subject: 'Thai', category: 'vocabulary', choices: ['หนาว', 'อุ่น', 'เย็น', 'หนาว/เย็น'], answerIndex: 2 },
  { id: 'th-w11', equation: '"วันจันทร์" เป็นวันที่เท่าไรในสัปดาห์?', subject: 'Thai', category: 'vocabulary', choices: ['วันที่ 1', 'วันที่ 2', 'วันที่ 3', 'วันที่ 7'], answerIndex: 1 },
  { id: 'th-w12', equation: 'คำว่า "สะพาน" หมายถึง?', subject: 'Thai', category: 'vocabulary', choices: ['ถนน', 'ทางข้ามแม่น้ำ', 'บ้าน', 'สวนสาธารณะ'], answerIndex: 1 },
]
