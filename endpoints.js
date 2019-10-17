module.exports = {
  // node
  prodCardsEndpoint: `https://f1-cards.herokuapp.com`,
  // python
  prodAPIEndpoint: `https://f1-api.herokuapp.com`,
  prodTeamCardLg: teamSlug => `/api/team/${teamSlug}`,
  prodTeamCardSm: teamSlug => `/api/mobile/team/${teamSlug}`,
  prodDriverCardLg: driverSlug => `/api/driver/${driverSlug}`,
  prodDriverCardSm: driverSlug => `/api/mobile/driver/${driverSlug}`
}
