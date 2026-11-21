import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

const sampleTuitions = [
  {
    title: "HSC Higher Mathematics & Calculus Mastery Batch",
    subject: "Higher Math",
    classLevel: "Class 11-12",
    mode: "Online",
    location: "Online (Google Meet)",
    monthlyFee: 3500,
    daysPerWeek: "3 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
    description: "Comprehensive calculus, coordinate geometry, and vectors masterclass for HSC and BUET/Medical admission aspirants. Includes weekly problem-solving sheets and recorded lectures.",
    tutorName: "Sabbir Hossain",
    tutorEmail: "sabbirt@gmail.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-15T10:00:00.000Z"),
  },
  {
    title: "SSC Physics Concept Clearance & Creative CQ Batch",
    subject: "Physics",
    classLevel: "Class 9-10",
    mode: "Offline",
    location: "Dhanmondi, Dhaka",
    monthlyFee: 4000,
    daysPerWeek: "3 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    description: "Deep dive into Mechanics, Optics, and Electricity. Every chapter followed by model tests based on recent board question patterns. Personal attention guaranteed.",
    tutorName: "Tanvir Ahmed",
    tutorEmail: "tanvir.tutor@example.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-16T11:00:00.000Z"),
  },
  {
    title: "Full Stack Web Development Mentorship (MERN + Next.js)",
    subject: "Programming",
    classLevel: "University / Career",
    mode: "Online",
    location: "Online (Discord & Zoom)",
    monthlyFee: 5000,
    daysPerWeek: "2 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    description: "1-on-1 and small batch mentorship to transition into software engineering. Covering React 19, Next.js, Node.js, TypeScript, MongoDB, and production deployments.",
    tutorName: "Sabbir Hossain",
    tutorEmail: "sabbirt@gmail.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-17T12:00:00.000Z"),
  },
  {
    title: "IELTS Academic Complete Preparation (Band 7.5+ Target)",
    subject: "IELTS",
    classLevel: "Higher Study / Adult",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 4500,
    daysPerWeek: "3 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    description: "Specialized mock-based training for IELTS Academic. Daily speaking evaluations, weekly essay corrections, and listening/reading strategic techniques for band 7.5 or higher.",
    tutorName: "Farhana Yasmin",
    tutorEmail: "farhana.ielts@example.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-18T09:00:00.000Z"),
  },
  {
    title: "HSC Organic Chemistry Mastery & Reaction Mechanisms",
    subject: "Chemistry",
    classLevel: "Class 11-12",
    mode: "Offline",
    location: "Uttara, Dhaka",
    monthlyFee: 4200,
    daysPerWeek: "3 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80",
    description: "Master organic synthesis, IUPAC nomenclature, isomerism, and reaction mechanisms. Dedicated chapter tests and medical admission standard question reviews.",
    tutorName: "Dr. Rakib Hasan",
    tutorEmail: "rakib.chem@example.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-18T14:30:00.000Z"),
  },
  {
    title: "O Level / IGCSE Mathematics D (Syllabus D) Preparation",
    subject: "General Math",
    classLevel: "Class 9-10",
    mode: "Online",
    location: "Online",
    monthlyFee: 6000,
    daysPerWeek: "3 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80",
    description: "Edexcel and Cambridge IGCSE Math D past paper practice (2015-2025). Formula memorization tricks, exam timing management, and guaranteed A* grade guidance.",
    tutorName: "Mahmudul Karim",
    tutorEmail: "mahmud.math@example.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-19T08:00:00.000Z"),
  },
  {
    title: "HSC ICT (Information & Communication Tech) Crash Course",
    subject: "ICT",
    classLevel: "Class 11-12",
    mode: "Online",
    location: "Online",
    monthlyFee: 2500,
    daysPerWeek: "2 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    description: "Covers C Programming, HTML/Web Design, Number Systems, and Database Management System (DBMS). Hand-written concise note sheets provided.",
    tutorName: "Sabu Rahman",
    tutorEmail: "saabu@gmail.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-19T11:00:00.000Z"),
  },
  {
    title: "Medical Admission Biology: Botany & Zoology Core Concepts",
    subject: "Biology",
    classLevel: "Class 11-12",
    mode: "Offline",
    location: "Mirpur, Dhaka",
    monthlyFee: 4500,
    daysPerWeek: "3 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80",
    description: "Line-by-line discussion of textbook with medical admission previous year MCQs analysis. Daily 50-mark chapter tests with negative marking simulator.",
    tutorName: "Nusrat Jahan",
    tutorEmail: "nusrat.bio@example.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-20T10:15:00.000Z"),
  },
  {
    title: "Spoken English & Professional Communication for Beginners",
    subject: "English",
    classLevel: "All Levels",
    mode: "Online",
    location: "Online",
    monthlyFee: 2800,
    daysPerWeek: "2 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    description: "Build English fluency without fear. Interactive speaking sessions, vocabulary expansion, accent polishing, and email writing etiquette for students and professionals.",
    tutorName: "Ayesha Siddiqua",
    tutorEmail: "ayesha.eng@example.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-20T16:00:00.000Z"),
  },
  {
    title: "HSC Principles of Accounting & Financial Statement Analysis",
    subject: "Accounting",
    classLevel: "Class 11-12",
    mode: "Offline",
    location: "Chattogram Sadar, Chattogram",
    monthlyFee: 3200,
    daysPerWeek: "3 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    description: "Clear understanding of debit-credit fundamentals, ledger entries, bank reconciliation, depreciation methods, and partnership accounts with board CQ solutions.",
    tutorName: "Kamrul Islam",
    tutorEmail: "kamrul.acc@example.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-21T09:30:00.000Z"),
  },
  {
    title: "Junior Science & Mathematics Foundation Batch",
    subject: "General Math",
    classLevel: "Class 6-8",
    mode: "Offline",
    location: "Gulshan, Dhaka",
    monthlyFee: 3500,
    daysPerWeek: "3 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    description: "Strengthening mental math, basic algebra, geometry, and elementary physics & chemistry foundations to prepare younger students for future competitive exams.",
    tutorName: "Sabu Rahman",
    tutorEmail: "saabu@gmail.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-21T13:00:00.000Z"),
  },
  {
    title: "Economics & Statistics for HSC & University Undergrads",
    subject: "Economics",
    classLevel: "Class 11-12",
    mode: "Online",
    location: "Online",
    monthlyFee: 3000,
    daysPerWeek: "2 Days / Week",
    bannerImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    description: "Microeconomics demand-supply curve modeling, macroeconomics GDP, inflation analysis, and introductory business statistics made easy with practical graphs.",
    tutorName: "Shahriar Noman",
    tutorEmail: "shahriar.econ@example.com",
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date("2026-11-21T15:00:00.000Z"),
  },
];

async function seed() {
  try {
    await client.connect();
    const db = client.db("Mentor-Lagbe");
    const tuitionsCollection = db.collection("tuitions");

    // Clear existing tuitions or seed if empty
    const count = await tuitionsCollection.countDocuments();
    console.log(`Current tuitions count in DB: ${count}`);

    if (count > 0) {
      console.log("Replacing/seeding fresh realistic tuitions...");
      await tuitionsCollection.deleteMany({});
    }

    const result = await tuitionsCollection.insertMany(sampleTuitions);
    console.log(`Successfully seeded ${result.insertedCount} tuitions into MongoDB!`);
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await client.close();
  }
}

seed();
