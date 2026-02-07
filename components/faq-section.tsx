"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What types of sessions can I host?",
    answer:
      "Our platform supports a wide range of real-time sessions: podcasts, team meetings, interviews, presentations, casual hangouts, and gaming sessions. Each session type has optimized settings for the best experience.",
  },
  {
    question: "How many participants can join a session?",
    answer:
      "You can have up to 10 participants simultaneously on our Professional and Enterprise plans. The Starter plan supports up to 2 participants. All plans include separate audio tracks for each person when recording.",
  },
  {
    question: "Do participants need to create an account?",
    answer:
      "No! Simply send them a link and they can join directly from their browser. No downloads, no account creation, no friction. This makes it incredibly easy to connect with anyone from anywhere in the world.",
  },
  {
    question: "Can I record my sessions?",
    answer:
      "Yes! All session types support recording. Our AI editing suite automatically removes filler words, silence, and background noise. For podcasts, you can add intro/outro music and publish directly to platforms.",
  },
  {
    question: "Which platforms can I publish podcasts to?",
    answer:
      "We automatically distribute to Spotify, Apple Podcasts, Google Podcasts, YouTube, Amazon Music, and 20+ other platforms. You can also export files directly if you prefer to upload manually. RSS feed generation is included.",
  },
  {
    question: "How do I get started with my first session?",
    answer:
      "Sign up for free, choose your session type (podcast, meeting, interview, presentation, casual, or gaming), then click 'Start Session'. You can start solo or send invite links to participants. Most users start their first session within minutes of signing up!",
  },
];

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <div className="w-full flex justify-center items-start">
      <div className="flex-1 px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
        {/* Left Column - Header */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <div className="w-full flex flex-col justify-center text-[#49423D] font-semibold leading-tight md:leading-[44px] font-sans text-4xl tracking-tight">
            Frequently Asked Questions
          </div>
          <div className="w-full text-[#605A57] text-base font-normal leading-7 font-sans">
            Everything you need to know about hosting sessions,
            <br className="hidden md:block" />
            recording, and connecting with your team.
          </div>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index);

              return (
                <div
                  key={index}
                  className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 text-[#49423D] text-base font-medium leading-6 font-sans">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center">
                      <ChevronDownIcon
                        className={`w-6 h-6 text-[rgba(73,66,61,0.60)] transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-[18px] text-[#605A57] text-sm font-normal leading-6 font-sans">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
