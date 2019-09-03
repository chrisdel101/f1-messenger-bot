module.exports = {
  production: params => {
    return `https://f1-cards.herokuapp.com/${params}`
  },
  scraper: params => {
    return `https://f1-api.herokuapp.com/${params}`
  },
  web: params => {
    return `https://f1-cards.herokuapp.com//api/driver/${params}`
  }
}
