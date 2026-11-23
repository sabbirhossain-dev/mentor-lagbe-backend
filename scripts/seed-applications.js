import {
  tuitionsCollection,
  usersCollection,
  applicationsCollection,
} from "../db.js";

async function seedApplications() {
  try {
    const tuitions = await tuitionsCollection
      .find({ approvalStatus: "approved" })
      .limit(4)
      .toArray();
    const students = await usersCollection
      .find({ role: "student" })
      .limit(3)
      .toArray();

    if (tuitions.length === 0 || students.length === 0) {
      console.log("Not enough tuitions or students to seed applications.");
      process.exit(0);
    }

    const currentCount = await applicationsCollection.countDocuments();
    if (currentCount > 0) {
      console.log(
        `Applications collection already has ${currentCount} records. Skipping seed.`,
      );
      process.exit(0);
    }

    // Sample applications data
    const sampleApplications = [
      {
        tuitionId: tuitions[0]._id.toString(),
        tuitionTitle: tuitions[0].title,
        subject: tuitions[0].subject,
        monthlyFee: tuitions[0].monthlyFee,
        tutorName: tuitions[0].tutorName,
        tutorEmail: tuitions[0].tutorEmail,
        studentName: students[0].name,
        studentEmail: students[0].email,
        studentPhone: "01711-234567",
        preferredSchedule: "Sat-Mon-Wed 6:00 PM",
        studentNote:
          "Looking forward to improving my calculus problem-solving speed for HSC.",
        status: "pending",
        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        tuitionId: tuitions[1]._id.toString(),
        tuitionTitle: tuitions[1].title,
        subject: tuitions[1].subject,
        monthlyFee: tuitions[1].monthlyFee,
        tutorName: tuitions[1].tutorName,
        tutorEmail: tuitions[1].tutorEmail,
        studentName: students[0].name,
        studentEmail: students[0].email,
        studentPhone: "01711-234567",
        preferredSchedule: "Sun-Tue-Thu 7:00 PM",
        studentNote: "Want to join the offline creative CQ batch.",
        status: "accepted",
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        tuitionId: tuitions[2]._id.toString(),
        tuitionTitle: tuitions[2].title,
        subject: tuitions[2].subject,
        monthlyFee: tuitions[2].monthlyFee,
        tutorName: tuitions[2].tutorName,
        tutorEmail: tuitions[2].tutorEmail,
        studentName: students[1]?.name || "Student Aspirant",
        studentEmail: students[1]?.email || "student.aspirant@example.com",
        studentPhone: "01822-987654",
        preferredSchedule: "Flexible evening batches",
        studentNote: "Excited for the full-stack web mentorship program.",
        status: "pending",
        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    const result = await applicationsCollection.insertMany(sampleApplications);
    console.log(
      `Successfully seeded ${result.insertedCount} sample applications!`,
    );
  } catch (error) {
    console.error("Seeding applications failed:", error);
  } finally {
    process.exit(0);
  }
}

seedApplications();
