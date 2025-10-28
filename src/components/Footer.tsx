import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-xl">
                <span style={{fontWeight: 800}}>Basic</span>
                <span style={{fontWeight: 300}}>Platform</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              En simpel platform til at administrere dine abonnementer og betalinger.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/#pricing" className="hover:text-white transition-colors">Priser</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/om-os" className="hover:text-white transition-colors">Om os</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Konto</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Log ind</Link></li>
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">Opret konto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/kontakt" className="hover:text-white transition-colors">Kontakt os</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Legal Links */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-center md:text-left">
              &copy; 2025 Basic Platform. Alle rettigheder forbeholdes.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm text-gray-400">
              <Link href="/handelsbetingelser" className="hover:text-white transition-colors">
                Handelsbetingelser
              </Link>
              <Link href="/privatlivspolitik" className="hover:text-white transition-colors">
                Privatlivspolitik
              </Link>
              <Link href="/cookiepolitik" className="hover:text-white transition-colors">
                Cookiepolitik
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
