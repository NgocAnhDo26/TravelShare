import { NavLink } from 'react-router-dom';

const tabs = [
  { label: 'For you', to: '/' },
  { label: 'Following', to: '/following' },
  { label: 'Trending', to: '/saas-growth' },
];

export default function HeaderTabs() {
  return (
    <div className='flex items-center gap-8 mb-8 border-b border-slate-200'>
      {tabs.map((tab) => (
        <NavLink
          key={tab.label}
          to={tab.to}
          className={({ isActive }) =>
            `pb-4 px-2 font-semibold transition-all duration-200 ${
              isActive
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`
          }
          end
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
