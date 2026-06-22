import { Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { categoryMeta } from '../constants/categories'

function Footer() {
  const year = new Date().getFullYear()
  const topCategories = categoryMeta.slice(0, 8)

  return (
    <footer className="mt-12 border-t border-gray-200 bg-white">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
                <LayoutGrid size={20} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-gray-950">Elan.az</div>
                <div className="text-xs text-gray-500">Al, sat, elan ver</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Azərbaycanda pulsuz elan yerləşdirmə platforması. Al, sat və xidmət tap.
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Kateqoriyalar</h3>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {topCategories.map((category) => (
                <li key={category.slug}>
                  <Link to={`/category/${category.slug}`} className="text-gray-700 hover:text-red-600">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Hesab</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/add-listing" className="text-gray-700 hover:text-red-600">Elan yerləşdir</Link>
              </li>
              <li>
                <Link to="/my-listings" className="text-gray-700 hover:text-red-600">Mənim elanlarım</Link>
              </li>
              <li>
                <Link to="/favorites" className="text-gray-700 hover:text-red-600">Favorilər</Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-700 hover:text-red-600">Profil</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-400">
          © {year} Elan.az. Bütün hüquqlar qorunur.
        </div>
      </div>
    </footer>
  )
}

export default Footer
