#!/usr/bin/env node

const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

// Disable auto-cancellation for seeding
pb.autoCancellation(false);

async function seed() {
  try {
    console.log('🌱 Seeding database...\n');
    
    // Auth as superuser (PocketBase v0.23+ uses _superusers collection)
    await pb.collection('_superusers').authWithPassword('test_super@test.edu.jo', 'test_super@test.edu.jo');
    console.log('✓ Authenticated as superuser\n');
    
    // Create subjects
    console.log('Creating subjects...');
    const subjects = await Promise.all([
      pb.collection('subjects').create({ name_ar: 'الرياضيات', name_en: 'Mathematics', code: 'MATH' }),
      pb.collection('subjects').create({ name_ar: 'العلوم', name_en: 'Science', code: 'SCI' }),
      pb.collection('subjects').create({ name_ar: 'اللغة العربية', name_en: 'Arabic Language', code: 'AR' }),
      pb.collection('subjects').create({ name_ar: 'اللغة الإنجليزية', name_en: 'English Language', code: 'ENG' }),
    ]);
    console.log(`✓ Created ${subjects.length} subjects\n`);
    
    // Create sections
    console.log('Creating class sections...');
    const sections = await Promise.all([
      pb.collection('class_sections').create({ grade_ar: 'الصف الأول', grade_en: '1st Grade', grade_order: 1, section_ar: 'شعبة أ', section_en: 'Section A' }),
      pb.collection('class_sections').create({ grade_ar: 'الصف الثاني', grade_en: '2nd Grade', grade_order: 2, section_ar: 'شعبة أ', section_en: 'Section A' }),
      pb.collection('class_sections').create({ grade_ar: 'الصف الثالث', grade_en: '3rd Grade', grade_order: 3, section_ar: 'شعبة أ', section_en: 'Section A' }),
    ]);
    console.log(`✓ Created ${sections.length} class sections\n`);
    
    // Create admin user
    console.log('Creating admin user...');
    const admin = await pb.collection('users').create({
      email: 'admin@manakher.edu.jo',
      password: 'Admin123!',
      passwordConfirm: 'Admin123!',
      name_ar: 'حسام الرقاد',
      name_en: 'Hussam',
      role: 'admin',
      verified: true
    });
    console.log(`✓ Created admin user: ${admin.email}\n`);
    
    // Create teacher user
    console.log('Creating teacher user...');
    const teacher = await pb.collection('users').create({
      email: 'teacher@manakher.edu.jo',
      password: 'Teacher123!',
      passwordConfirm: 'Teacher123!',
      name_ar: 'المعلمة سارة',
      name_en: 'Sarah',
      role: 'teacher',
      verified: true,
      subjects: [subjects[0].id, subjects[1].id] // Math and Science
    });
    console.log(`✓ Created teacher user: ${teacher.email}\n`);
    
     // Create student user
     console.log('Creating student user...');
     const student = await pb.collection('users').create({
       email: 'student@manakher.edu.jo',
       password: 'Student123!',
       passwordConfirm: 'Student123!',
       name_ar: 'الطالب أحمد',
       name_en: 'Ahmed',
       role: 'student',
       verified: true,
       sections: [sections[0].id] // 1st Grade A
     });
     console.log(`✓ Created student user: ${student.email}\n`);
    
    console.log('✅ Database seeding complete!\n');
    console.log('=== Login Credentials ===');
    console.log('Admin:   admin@manakher.edu.jo / Admin123!');
    console.log('Teacher: teacher@manakher.edu.jo / Teacher123!');
    console.log('Student: student@manakher.edu.jo / Student123!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    process.exit(1);
  }
}

seed();
