import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, BookOpen, Terminal, Database, Cloud, 
  Cpu, ArrowRight, Tag, Clock, ChevronRight, 
  Box, BarChart3, ShieldCheck
} from 'lucide-react'

const CATEGORIES = [
  { id: 'tech', label: 'Tech Articles', icon: Terminal, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'docs', label: 'Project Documentation', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'arch', label: 'Architecture Deep Dives', icon: Database, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'stories', label: 'Engineering Stories', icon: Cpu, color: 'text-amber-500', bg: 'bg-amber-500/10' }
]

const TAGS = ['Analytics', 'Architecture', 'Inventory', 'KDS', 'React', 'Node.js', 'PostgreSQL', 'Performance']

const FEATURED_ARTICLE = {
  id: 1,
  title: "Scaling InventoPro: Our Journey to Multi-tenant Architecture",
  excerpt: "Discover how we migrated our core inventory management system from a single-tenant monolith to a high-performance, fully isolated multi-tenant architecture using Row Level Security (RLS) in PostgreSQL.",
  category: "Architecture Deep Dives",
  author: "Engineering Team",
  date: "Sep 25, 2026",
  readTime: "8 min read",
  image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
  tags: ["Architecture", "PostgreSQL", "Scale"]
}

const ARTICLES = [
  {
    id: 2,
    title: "Building a Real-time Kitchen Display System (KDS)",
    excerpt: "A technical walkthrough of how we use WebSockets and event-driven architecture to power our lightning-fast KDS.",
    category: "Product Engineering Stories",
    author: "Frontend Team",
    date: "Sep 20, 2026",
    readTime: "6 min read",
    tags: ["KDS", "React", "WebSockets"]
  },
  {
    id: 3,
    title: "Advanced Analytics: Processing 1M+ Sales Records",
    excerpt: "How we optimized our database queries and indexing strategies to deliver real-time sales reports.",
    category: "Tech Articles",
    author: "Data Engineering",
    date: "Sep 15, 2026",
    readTime: "5 min read",
    tags: ["Analytics", "Performance"]
  },
  {
    id: 4,
    title: "InventoPro API Documentation v2.0",
    excerpt: "Complete reference guide for integrating with the new InventoPro REST and GraphQL APIs.",
    category: "Project Documentation",
    author: "DevRel Team",
    date: "Sep 10, 2026",
    readTime: "12 min read",
    tags: ["Documentation", "API"]
  },
  {
    id: 5,
    title: "Zero-Downtime Inventory Synchronization",
    excerpt: "Tackling the hard problems of distributed inventory tracking across multiple physical locations.",
    category: "Architecture Deep Dives",
    author: "Backend Team",
    date: "Sep 05, 2026",
    readTime: "9 min read",
    tags: ["Inventory", "Architecture"]
  }
]

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-primary-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Box className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                InventoPro Blog
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Product
              </Link>
              <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all hover:-translate-y-0.5">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section / Search */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Engineering & Product <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
              Insights from InventoPro
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Deep dives into our architecture, product engineering stories, and documentation on building a modern SaaS platform.
          </p>
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search articles, documentation, architecture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-4 rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white transition-shadow hover:shadow-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Featured Article */}
            {!searchQuery && activeCategory === 'All' && (
              <section className="animate-fade-in">
                <div className="flex items-center gap-2 mb-6">
                  <div className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5" />
                    Featured
                  </div>
                </div>
                <div className="group relative rounded-3xl overflow-hidden bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 transition-all hover:shadow-2xl">
                  <div className="aspect-[21/9] w-full overflow-hidden bg-gray-200 dark:bg-gray-800 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    <img 
                      src={FEATURED_ARTICLE.image} 
                      alt={FEATURED_ARTICLE.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {FEATURED_ARTICLE.tags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 text-xs font-medium rounded-md bg-white/20 backdrop-blur-md text-white border border-white/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                        {FEATURED_ARTICLE.title}
                      </h2>
                      <div className="flex items-center gap-4 text-gray-300 text-sm">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {FEATURED_ARTICLE.readTime}</span>
                        <span>•</span>
                        <span>{FEATURED_ARTICLE.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 leading-relaxed">
                      {FEATURED_ARTICLE.excerpt}
                    </p>
                    <button className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold group-hover:gap-3 transition-all">
                      Read Full Article <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Latest Articles */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Latest Posts</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {['All', 'Tech Articles', 'Architecture Deep Dives', 'Product Engineering Stories'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        activeCategory === cat 
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {ARTICLES.filter(article => 
                  (activeCategory === 'All' || article.category === activeCategory) &&
                  (article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   article.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
                ).map((article) => (
                  <article key={article.id} className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                        {article.category}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-grow line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="mt-auto">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.slice(0,2).map(tag => (
                          <span key={tag} className="px-2 py-1 text-[11px] font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <span>{article.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {article.readTime}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Product Information Sidebar */}
            <div className="bg-gradient-to-br from-primary-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-6 border border-white/20">
                  <Box className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">InventoPro SaaS</h3>
                <p className="text-primary-100 text-sm mb-6 leading-relaxed">
                  The modern inventory management system built for scale. Manage stock, track analytics, and optimize your supply chain in real-time.
                </p>
                
                <ul className="space-y-3 mb-8">
                  {[
                    { icon: ShieldCheck, text: "Multi-tenant Architecture" },
                    { icon: BarChart3, text: "Real-time Analytics" },
                    { icon: Database, text: "99.99% Uptime SLA" }
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-primary-50">
                      <feature.icon className="w-4 h-4 text-primary-300" />
                      {feature.text}
                    </li>
                  ))}
                </ul>
                
                <Link to="/signup" className="block w-full py-3 px-4 bg-white text-primary-900 text-center font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg">
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Categories
              </h3>
              <ul className="space-y-2">
                {CATEGORIES.map(cat => (
                  <li key={cat.id}>
                    <button 
                      onClick={() => setActiveCategory(cat.label)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center`}>
                          <cat.icon className={`w-4 h-4 ${cat.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {cat.label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Tags */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Popular Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 border border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} InventoPro Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
