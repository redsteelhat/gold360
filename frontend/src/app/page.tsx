import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="card p-8 w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl mb-6 font-bold text-primary">
            Welcome to Gold360
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The complete digital platform for jewelry businesses. Manage your inventory, online store, 
            customer relationships, and business operations all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              title: 'E-Commerce & Sales',
              description: 'Sell your jewelry online with a beautiful catalog and seamless checkout experience.',
              link: '#',
            },
            {
              title: 'Inventory Management',
              description: 'Track your inventory in real-time with complete visibility across multiple locations.',
              link: '#',
            },
            {
              title: 'CRM & Loyalty',
              description: 'Build lasting customer relationships with personalized marketing and loyalty programs.',
              link: '#',
            },
            {
              title: 'Business Analytics',
              description: 'Make data-driven decisions with comprehensive reports and analytics dashboards.',
              link: '#',
            },
          ].map((feature, index) => (
            <Link href={feature.link} key={index} className="card p-6 bg-white hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-primary">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Link>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">Operational Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: 'Shipping Management',
              description: 'Manage shipping operations, carriers, and track packages.',
              link: '/shipping',
            },
            {
              title: 'Shipping Providers',
              description: 'Configure and manage your shipping carrier integrations.',
              link: '/shipping/providers',
            },
            {
              title: 'Tracking & Delivery',
              description: 'Track packages and manage delivery updates.',
              link: '/shipping/track',
            },
          ].map((module, index) => (
            <Link href={module.link} key={index} className="card p-6 bg-white hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-primary">{module.title}</h3>
              <p className="text-gray-600">{module.description}</p>
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="btn-primary py-3 px-8">
            Request Demo
          </button>
          <button className="btn-outline py-3 px-8">
            Learn More
          </button>
        </div>
      </div>
    </main>
  );
} 