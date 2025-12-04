import React from 'react';
import { LayoutTemplate, Sparkles } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans antialiased overflow-x-hidden selection:bg-yellow-200">
      <style>{`
        body {
          background-color: #fdfbf7;
          background-image: radial-gradient(#d1d8e0 1px, transparent 1px);
          background-size: 24px 24px;
        }
        
        .scribble-underline {
          position: relative;
          z-index: 1;
        }
        .scribble-underline::after {
          content: '';
          position: absolute;
          left: -5px;
          bottom: 2px;
          width: 105%;
          height: 12px;
          background: #fdcb6e;
          z-index: -1;
          transform: rotate(-1deg);
          border-radius: 20px;
          opacity: 0.6;
        }
        
        .paper-card {
          background: white;
          border: 2px solid #2d3436;
          box-shadow: 6px 6px 0px 0px #2d3436;
          transition: all 0.2s ease;
        }
        .paper-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 8px 8px 0px 0px #2d3436;
        }
        
        .sticker {
          background: white;
          padding: 8px 16px;
          border: 2px solid #2d3436;
          transform: rotate(-2deg);
          display: inline-block;
          font-weight: bold;
          font-family: 'Patrick Hand', cursive;
        }
        .sticker:nth-child(even) { 
          transform: rotate(2deg); 
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b-2 border-[#2d3436] bg-[#fdfbf7]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">ExamGen<span className="text-indigo-600">AI</span></span>
          </div>
          <div className="hidden md:flex gap-8 font-medium">
            <a href="#demo" className="hover:underline decoration-wavy decoration-indigo-600 decoration-2 underline-offset-4">How It Works</a>
            <a href="#features" className="hover:underline decoration-wavy decoration-indigo-600 decoration-2 underline-offset-4">Features</a>
            <a href="#tech" className="hover:underline decoration-wavy decoration-indigo-600 decoration-2 underline-offset-4">Tech Stack</a>
          </div>
          <button 
            onClick={onGetStarted}
            className="font-bold bg-indigo-600 text-white px-6 py-2 border-2 border-black shadow-[4px_4px_0px_0px_#2d3436] hover:shadow-[2px_2px_0px_0px_#2d3436] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg flex items-center gap-2"
          >
            Launch App <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-block px-3 py-1 bg-yellow-100 border-2 border-black rounded-full font-bold text-sm mb-6 transform -rotate-1 shadow-sm">
              ✨ Powered by Gemini 2.5
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] mb-8 text-[#2d3436]">
              Turn your <br />
              <span className="text-indigo-600 text-6xl lg:text-8xl block mt-2 transform -rotate-2" style={{fontFamily: "'Patrick Hand', cursive"}}>messy scribbles</span>
              into <span className="scribble-underline">perfect exams.</span>
            </h1>
            <p className="text-xl text-[#636e72] font-medium mb-10 leading-relaxed max-w-lg">
              Stop typing questions manually. Upload a photo of your handwritten draft, and our AI builds the PDF, draws the diagrams, and formats the math.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onGetStarted}
                className="text-center px-8 py-4 bg-[#2d3436] text-white font-bold text-lg rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#2d3436] hover:shadow-[2px_2px_0px_0px_#2d3436] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Start Generating Now
              </button>
              <a 
                href="#demo" 
                className="text-center px-8 py-4 bg-white text-[#2d3436] font-bold text-lg rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#2d3436] hover:shadow-[2px_2px_0px_0px_#2d3436] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg> Learn More
              </a>
            </div>
            
            {/* Trust Badge */}
            <div className="mt-12 flex items-center gap-4 text-sm font-bold text-[#636e72]">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center">👩‍🏫</div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-green-100 flex items-center justify-center">👨‍🔬</div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center">📝</div>
              </div>
              <p>Loved by teachers & educators worldwide.</p>
            </div>
          </div>

          {/* Right: Visual Metaphor */}
          <div className="relative">
            <svg className="absolute -top-12 left-0 w-24 h-24 text-[#636e72] transform -rotate-12 hidden lg:block" viewBox="0 0 100 100">
              <path fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="5,5" d="M10,80 Q50,10 90,50" />
              <path fill="currentColor" d="M90,50 L80,45 L85,55 Z" />
            </svg>

            {/* Draft Paper */}
            <div className="absolute top-0 left-0 w-3/4 h-full bg-white border-2 border-black shadow-lg transform -rotate-3 p-6 z-10 rounded-lg">
              <div className="text-2xl text-indigo-600 leading-loose" style={{fontFamily: "'Patrick Hand', cursive"}}>
                Q1. Calculate area:<br />
                <div className="border-2 border-indigo-600 w-20 h-20 my-2"></div>
                If x = 10...
                <br /><br />
                Q2. Explain Photosynthesis...
              </div>
              <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-sans uppercase tracking-widest">Input: Handwriting</div>
            </div>

            {/* Digital Paper */}
            <div className="relative mt-24 ml-24 w-3/4 bg-white border-2 border-black shadow-[6px_6px_0px_0px_#2d3436] z-20 rounded-lg overflow-hidden">
              <div className="bg-gray-100 border-b-2 border-black p-3 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 border border-black"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black"></div>
              </div>
              <div className="p-6 font-sans">
                <h3 className="font-bold text-lg mb-4 border-b-2 border-gray-200 pb-2">Mathematics Final</h3>
                <div className="mb-4">
                  <p className="font-bold mb-2">1. Calculate the area of the square.</p>
                  <div className="w-full h-24 bg-blue-50 border border-blue-200 rounded flex items-center justify-center text-blue-500 mb-2">
                    📊 Vector Image Generated
                  </div>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded">x = 10 units</p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-xs text-green-600 font-bold uppercase tracking-widest bg-green-100 px-2 py-1 rounded">Output: PDF</div>
            </div>
          </div>
        </div>
      </header>

      {/* Sketchy Divider */}
      <div className="w-full overflow-hidden leading-[0]">
        <svg className="relative block w-[calc(100%+1.3px)] h-[50px] transform rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#2d3436"></path>
        </svg>
      </div>

      {/* How it Works */}
      <section id="demo" className="bg-[#2d3436] text-[#fdfbf7] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">From <span className="text-[#fdcb6e]" style={{fontFamily: "'Patrick Hand', cursive"}}>Chaos</span> to Clarity</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Our pipeline connects the best AI tools to handle the messy work for you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[#2d3436]">
            {[
              { num: 1, emoji: '📸', title: 'Snap & Upload', desc: "Don't scan. Just take a photo of your notebook. We handle bad lighting and messy handwriting." },
              { num: 2, emoji: '🧠', title: 'AI Analyzes', desc: 'Gemini 2.5 reads your handwriting, extracts questions, detects diagrams, and understands context.' },
              { num: 3, emoji: '📄', title: 'Download PDF', desc: 'Get a beautifully formatted exam paper, ready to print. Edit anything before you save.' }
            ].map((step) => (
              <div key={step.num} className="bg-[#fdfbf7] p-8 rounded-xl border-4 border-gray-600 relative group hover:rotate-1 transition-transform duration-300">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#fdcb6e] border-2 border-black rounded-full flex items-center justify-center font-bold text-xl">{step.num}</div>
                <div className="h-48 flex items-center justify-center mb-6 border-b-2 border-dashed border-gray-300 text-6xl">
                  {step.emoji}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-[#636e72] font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Packed with <span className="scribble-underline">Smart Features</span></h2>
            <p className="text-xl text-[#636e72] max-w-2xl mx-auto">Everything a teacher needs to create professional exams in minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: '🎯', title: 'Smart OCR', desc: 'Understands handwriting, diagrams, tables, and mathematical notation with high accuracy.' },
              { emoji: '🎨', title: 'Auto Diagrams', desc: 'Converts sketches into clean vector graphics and generates diagrams from descriptions.' },
              { emoji: '📊', title: 'Format Math', desc: 'Automatically formats equations, fractions, and mathematical symbols perfectly.' },
              { emoji: '☁️', title: 'Cloud Storage', desc: 'Save your papers to the cloud and access them from anywhere, anytime.' },
              { emoji: '✏️', title: 'Full Editor', desc: 'Edit questions, add images, adjust formatting, and customize everything before printing.' },
              { emoji: '🔒', title: 'Secure & Private', desc: 'Your data is encrypted and never shared. Full control over your exam papers.' }
            ].map((feature, idx) => (
              <div key={idx} className="paper-card p-6">
                <div className="text-4xl mb-4">{feature.emoji}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-[#636e72]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-24 px-6 bg-[#2d3436] text-[#fdfbf7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Built with <span className="text-[#fdcb6e]">Modern Tech</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Cutting-edge AI and web technologies working together seamlessly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Gemini 2.5', 'React 19', 'TypeScript', 'Supabase', 'TailwindCSS', 'Vite', 'Pollinations AI', 'Lucide Icons'].map((tech, idx) => (
              <div key={idx} className="sticker text-[#2d3436] bg-[#fdfbf7]">{tech}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-[#fdfbf7]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Exams?</h2>
          <p className="text-xl text-[#636e72] mb-10">Join teachers worldwide who are saving hours every week with ExamGen AI.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-[#2d3436] text-white font-bold text-lg rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#2d3436] hover:shadow-[2px_2px_0px_0px_#2d3436] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Get Started Free
            </button>
            <a 
              href="#features" 
              className="px-8 py-4 bg-white text-[#2d3436] font-bold text-lg rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#2d3436] hover:shadow-[2px_2px_0px_0px_#2d3436] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2d3436] text-[#fdfbf7] py-12 px-6 border-t-2 border-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <LayoutTemplate className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">ExamGen.ai</span>
              </div>
              <p className="text-gray-400">Turn handwritten exams into digital perfection.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#demo" className="hover:text-[#fdfbf7] transition-colors">How It Works</a></li>
                <li><a href="#features" className="hover:text-[#fdfbf7] transition-colors">Features</a></li>
                <li><button onClick={onGetStarted} className="hover:text-[#fdfbf7] transition-colors">Launch App</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-[#fdfbf7] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#fdfbf7] transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#fdfbf7] transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ExamGen AI. All rights reserved. Built with ❤️ for educators.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
