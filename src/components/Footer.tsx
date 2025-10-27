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
              <li><Link href="/#pricing" className="hover:text-white">Priser</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Konto</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/auth/login" className="hover:text-white">Log ind</Link></li>
              <li><Link href="/auth/signup" className="hover:text-white">Opret konto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="mailto:support@basicplatform.dk" className="hover:text-white">Kontakt os</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Basic Platform. Alle rettigheder forbeholdes.</p>
        </div>
      </div>
    </footer>
  )
}
