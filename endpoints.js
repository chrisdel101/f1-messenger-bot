module.exports = {
  localAPI: params => {
    return `http://localhost:5000/${params}`
  },
  localWeb: params => {
    return `http://localhost:3000/${params}`
  },
  productionWeb: params => {
    return `https://f1-cards.herokuapp.com/${params}`
  },
  productionAPI: params => {
    return `https://f1-api.herokuapp.com/${params}`
  },
  productionCards: params => {
    return `https://f1-cards.herokuapp.com/api/driver/${params}`
  }
}
