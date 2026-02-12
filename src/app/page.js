import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">

      {/* Hero Section */}
      <section className="text-center py-32 px-6 bg-gradient-to-r from-[#D2640D] to-[#7607B3] text-white">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg">
          Welcome to Futuristic Learning
        </h1>
        <p className="text-xl md:text-2xl mb-4 drop-shadow">
          Learn Faster, Think Smarter, & Achieve More
        </p>
        <p className="max-w-3xl mx-auto mb-8 text-lg md:text-xl drop-shadow-sm">
          We know how to upgrade your brain, and we’re here to help you reach your highest potential.
        </p>

        <div className="mt-8">
          <Link
            href="#courses"
            className="bg-white text-[#7607B3] px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:scale-105 transition-transform duration-300 hover:opacity-90"
          >
            Explore Courses
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 text-center max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold mb-6 text-[#7607B3]">Learn from the Best!</h2>
        <p className="mb-4 text-lg md:text-xl">
          Our training has produced World Memory, Mind Mapping and Speed Reading Champions.
        </p>
        <p className="mb-4 text-lg md:text-xl">
          We proudly hold six Guinness World Records for memory excellence.
        </p>
        <p className="text-lg md:text-xl">
          Only four experts in the world are certified at the Master level to teach what we teach — and we are one of them.
        </p>
        <p className="mt-6 font-bold text-[#D2640D] text-xl md:text-2xl">
          It’s YOUR turn to become LIMITLESS!
        </p>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 px-6 bg-gray-100">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#7607B3]">
          Our Mastery Courses
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {/* Course Card */}
          {[
            {
              title: "Mind Mapping Mastery",
              desc: "A tool that optimizes your learning, productivity & performance level.",
              price: "$297.99",
              img: "https://static.wixstatic.com/media/8d88a8_8c98beee97bc43dba762a4a3eec938e0~mv2.webp/v1/fill/w_263,h_190,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/mind%20mapping.webp"
            },
            {
              title: "Memory Mastery",
              desc: "Learn memory techniques that will help you NEVER FORGET important information.",
              price: "$297.99",
              img: "https://static.wixstatic.com/media/742122_164c45f3ee7048cdbd896adda94ec1a8~mv2.webp/v1/fill/w_271,h_190,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/MS%20Thumbnail.webp"
            },
            {
              title: "Speed Reading Mastery",
              desc: "Read 10X faster with our step-by-step guide to elevate your speed and comprehension.",
              price: "$297.99",
              img: "https://static.wixstatic.com/media/8d88a8_4a630734475b475994dacf755de4d01c~mv2.png/v1/fill/w_271,h_185,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/speed%20reading.png"
            },
          ].map((course, i) => (
            <div
              key={i}
              className="bg-white shadow-lg rounded-xl p-6 text-center transform transition-all duration-300 hover:-translate-y-4 hover:shadow-2xl"
            >
              <img
                src={course.img}
                alt={course.title}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
              <h3 className="text-2xl font-bold mb-3 text-[#D2640D]">{course.title}</h3>
              <p className="mb-4 text-gray-700">{course.desc}</p>
              <p className="font-bold text-lg mb-4">{course.price}</p>
              <button className="bg-[#7607B3] text-white px-6 py-2 rounded-full font-semibold hover:scale-105 hover:shadow-lg transition-all duration-300">
                Enroll Now
              </button>
            </div>
          ))}

        </div>
      </section>

      {/* Newsletter */}
   <section className="py-20 px-6 flex justify-center bg-gradient-to-r from-[#D2640D]/20 to-[#7607B3]/20">
  <div className="bg-white rounded-3xl shadow-xl p-10 max-w-xl w-full text-center">
    <h2 className="text-3xl font-bold mb-4 text-[#7607B3]">Subscribe to our Newsletter</h2>
    <p className="mb-8 text-lg text-gray-700">
      Get exclusive content, course updates, and free learning resources.
    </p>

    <div className="flex flex-col sm:flex-row justify-center gap-4">
      <input
        type="email"
        placeholder="Enter your email"
        className="border border-gray-300 px-5 py-3 rounded-full w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#D2640D] transition-all duration-300"
      />
      <button className="bg-[#7607B3] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#5a056f] hover:scale-105 transition-transform duration-300">
        Subscribe
      </button>
    </div>

  </div>
</section>


      {/* Footer */}
      <footer className="bg-[#7607B3] text-white text-center py-8">
        <p className="mb-2 font-medium">Visit Our Main Website | About Us | Photo Gallery</p>
        <p className="text-sm">
          © Copyright 2026 by Futuristic Learning (Institute of Human Memory Development International LLC) United States of America
        </p>
      </footer>

    </main>
  );
}
