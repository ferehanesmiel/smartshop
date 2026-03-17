import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useAuth } from '../AuthContext';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'am', name: 'አማርኛ' },
  { code: 'om', name: 'Afaan Oromoo' },
  { code: 'ti', name: 'ትግርኛ' },
  { code: 'so', name: 'Soomaali' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { updateLanguage } = useAuth();

  const changeLanguage = (lng: string) => {
    updateLanguage(lng);
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand transition-colors bg-white border border-slate-200 rounded-xl">
        <Globe className="w-4 h-4" />
        <span>{languages.find(l => l.code === i18n.language)?.name || 'Language'}</span>
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-2 space-y-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                i18n.language === lang.code
                  ? 'bg-brand/10 text-brand font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
