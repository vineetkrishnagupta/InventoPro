import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, ArrowRight, Clock, 
  ChevronRight, Box, Mail, Tag,
  FileText
} from 'lucide-react'

const CATEGORIES = [
  'All',
  'Tech Articles',
  'Project Documentation',
  'Architecture Deep Dives',
  'Product Engineering Stories'
]

const TAGS = ['Analytics', 'Architecture', 'Inventory', 'KDS', 'React', 'Node.js', 'PostgreSQL', 'Performance']

const FEATURED_ARTICLE = {
  id: 1,
  title: "Scaling InventoPro: Our Journey to Multi-tenant Architecture",
  excerpt: "Discover how we migrated our core inventory management system from a single-tenant monolith to a high-performance, fully isolated multi-tenant architecture using Row Level Security (RLS) in PostgreSQL. This transition allowed us to scale seamlessly across thousands of active organizations while maintaining absolute data privacy.",
  category: "Architecture Deep Dives",
  author: "Engineering Team",
  date: "Sep 25, 2026",
  readTime: "8 min read",
  image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
  tags: ["Architecture", "PostgreSQL", "Scale"]
}

const ARTICLES = [
  {
    id: 2,
    title: "Building a Real-time Kitchen Display System (KDS)",
    excerpt: "A technical walkthrough of how we use WebSockets and event-driven architecture to power our lightning-fast KDS for enterprise restaurants.",
    category: "Product Engineering Stories",
    author: "Frontend Team",
    date: "Sep 20, 2026",
    readTime: "6 min read",
    tags: ["KDS", "React", "WebSockets"]
  },
  {
    id: 3,
    title: "Advanced Analytics: Processing 1M+ Sales Records",
    excerpt: "How we optimized our database queries and indexing strategies to deliver real-time sales reports without compromising performance.",
    category: "Tech Articles",
    author: "Data Engineering",
    date: "Sep 15, 2026",
    readTime: "5 min read",
    tags: ["Analytics", "Performance"]
  },
  {
    id: 4,
    title: "InventoPro API Documentation v2.0",
    excerpt: "Complete reference guide for integrating with the new InventoPro REST and GraphQL APIs, featuring comprehensive webhooks support.",
    category: "Project Documentation",
    author: "DevRel Team",
    date: "Sep 10, 2026",
    readTime: "12 min read",
    tags: ["Documentation", "API"]
  },
  {
    id: 5,
    title: "Zero-Downtime Inventory Synchronization",
    excerpt: "Tackling the hard problems of distributed inventory tracking across multiple physical locations with event sourcing.",
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

  const filteredArticles = ARTICLES.filter(article => 
    (activeCategory === 'All' || article.category === activeCategory) &&
    (article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     article.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100">
      
      {/* Enterprise Top Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                InventoPro
              </span>
              <span className="text-gray-400 dark:text-gray-600 mx-2">|</span>
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">Blog</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Product
              </Link>
              <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="text-sm font-medium px-5 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm">
                TRY FOR FREE
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Insights & Engineering
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Technical articles, product updates, and architecture deep dives.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Category Navigation (Zoho Style Tabs) */}
        <div className="border-b border-gray-200 dark:border-gray-800 mb-10 overflow-x-auto no-scrollbar">
          <nav className="flex space-x-8 min-w-max" aria-label="Tabs">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeCategory === category 
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                `}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content Feed */}
          <div className="lg:col-span-8">
            
            {/* Featured Article - Horizontal Layout */}
            {!searchQuery && activeCategory === 'All' && (
              <div className="mb-12 group cursor-pointer bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="md:flex">
                  <div className="md:w-1/2 relative overflow-hidden">
                    <img 
                      src={FEATURED_ARTICLE.image} 
                      alt={FEATURED_ARTICLE.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 min-h-[250px]"
                    />
                  </div>
                  <div className="md:w-1/2 p-8 flex flex-col justify-center">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                      Featured • {FEATURED_ARTICLE.category}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {FEATURED_ARTICLE.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3">
                      {FEATURED_ARTICLE.excerpt}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-4 mt-auto">
                      <span>{FEATURED_ARTICLE.date}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {FEATURED_ARTICLE.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Article Grid List */}
            <div className="space-y-6">
              {filteredArticles.map((article) => (
                <article key={article.id} className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                      {article.category}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{article.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {article.readTime}</span>
                      <span className="hidden sm:inline-block border-l border-gray-300 dark:border-gray-700 pl-4">
                        By {article.author}
                      </span>
                    </div>
                  </div>
                  <div className="md:w-32 flex flex-col justify-end md:items-end mt-4 md:mt-0">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 group">
                      Read More <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </article>
              ))}

              {filteredArticles.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No articles found</h3>
                  <p className="text-gray-500 text-sm">We couldn't find any articles matching your search criteria.</p>
                </div>
              )}
            </div>

          </div>

          {/* Clean Enterprise Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Newsletter Subscription */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Stay Updated</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                Get our latest articles and engineering updates delivered directly to your inbox.
              </p>
              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Work email address" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* Product Promo - Clean UI */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Try InventoPro</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                The inventory platform that scales with your enterprise. Built with robust multi-tenancy and real-time synchronization.
              </p>
              <Link to="/signup" className="flex items-center justify-between text-sm font-medium text-blue-600 dark:text-blue-400 group">
                <span>Start your free trial</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Popular Topics Box */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" /> Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-transparent"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
      
      {/* Enterprise Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">InventoPro</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} InventoPro Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
