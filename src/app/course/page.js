"use client";

import Link from "next/link";

export default function CoursePage() {
  // Example courses (aap Firebase se fetch bhi kar sakte ho)
  const courses = [
    {
      id: "1",
      title: "Mind Mapping Mastery",
      description: "Optimize your learning & productivity.",
      price: "$297.99",
      image: "https://static.wixstatic.com/media/8d88a8_8c98beee97bc43dba762a4a3eec938e0~mv2.webp"
    },
    {
      id: "2",
      title: "Memory Mastery",
      description: "Never forget important information.",
      price: "$297.99",
      image: "https://static.wixstatic.com/media/742122_164c45f3ee7048cdbd896adda94ec1a8~mv2.webp"
    },
    {
      id: "3",
      title: "Speed Reading Mastery",
      description: "Read 10X faster with better comprehension.",
      price: "$297.99",
      image: "https://static.wixstatic.com/media/8d88a8_4a630734475b475994dacf755de4d01c~mv2.png"
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100 py-16 px-6">
      <h1 className="text-3xl font-bold text-center text-[#7607B3] mb-12">
        Our Courses
      </h1>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {courses.map(course => (
          <div key={course.id} className="bg-white shadow-lg rounded-xl p-6 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
            <img src={course.image} alt={course.title} className="w-full h-52 object-cover rounded-xl mb-4" />
            <h3 className="text-xl font-bold mb-3 text-[#D2640D]">{course.title}</h3>
            <p className="mb-4">{course.description}</p>
            <p className="font-bold text-lg mb-4">{course.price}</p>
            <Link href={`/course/${course.id}`}>
              <button className="bg-[#7607B3] text-white px-5 py-2 rounded-full hover:bg-[#5a056f] transition-colors">
                Enroll Now
              </button>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
