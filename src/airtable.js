import Airtable from 'airtable';

// Configure Airtable with the Personal Access Token
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: process.env.REACT_APP_AIRTABLE_PERSONAL_ACCESS_TOKEN,
});

// Point to our specific base
const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

export default base;