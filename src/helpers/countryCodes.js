
import countryCodes from 'i18n-iso-countries';
import countryCodesEn from 'i18n-iso-countries/langs/en.json';

countryCodes.registerLocale(countryCodesEn);

export default {
  getName(code) {
    if (code === 'PSE') {
      // TODO: Palestine West Bank in v-dem?
      return 'Palestinian Territory';
    }
    return countryCodes.getName(code, 'en');
  },

  alpha2ToAlpha3(code) {
    return countryCodes.alpha2ToAlpha3(code);
  },

  alpha3ToAlpha2(code) {
    return countryCodes.alpha3ToAlpha2(code);
  },
};
