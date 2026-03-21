import { MultiLangString } from '../types';

export const getLangString = (str: string | MultiLangString | undefined, lang: string = 'en'): string => {
  if (!str) return '';
  if (typeof str === 'string') return str;
  return str[lang as keyof MultiLangString] || str.en || '';
};
