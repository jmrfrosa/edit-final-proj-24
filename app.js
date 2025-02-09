const BASE_URL = 'http://116.203.151.6:3001'

const foodTypeMap = {
  french: 'Francês',
  desserts: 'Sobremesas',
  seafood: 'Marisco',
  japanese: 'Japonês',
  italian: 'Italiano',
  pasta: 'Massa',
  mexican: 'Mexicano',
  tacos: 'Tacos',
  bbq: 'BBQ',
  chinese: 'Chinês',
  noodles: 'Noodles',
  indian: 'Indiano',
  vegetarian: 'Vegetariano',
  american: 'Americano',
  burgers: 'Burgers',
  wings: 'Asas',
}

const categoryTypeMap = {
  breakfast: 'Pequeno-almoço',
  dinner: 'Jantar',
  dessert: 'Sobremesa',
  lunch: 'Almoço',
  snacks: 'Snacks',
}

const countries = ['FR', 'JP', 'IT', 'MX', 'CN', 'IN', 'US']

// Building select options dynamically from above lists
function setupSearch() {
  const foodTypeSelectNode = document.querySelector('#food-type-selector')
  for (const [key, value] of Object.entries(foodTypeMap)) {
    const opt = document.createElement('option')

    opt.value = key
    opt.innerText = value

    foodTypeSelectNode.appendChild(opt)
  }
  const countrySelectNode = document.querySelector('#country-selector')
  for (const countryCode of countries) {
    const opt = document.createElement('option')

    opt.value = countryCode
    opt.innerText = formatCountry(countryCode)

    countrySelectNode.appendChild(opt)
  }
}

// General DOM nodes
const restaurantSearchForm = document.querySelector('#search-form')
const restaurantListNode = document.querySelector('#restaurants')
const orderDialogNode = document.querySelector('#order-dialog')
const orderDialogOpenBtn = document.querySelector('#order-dialog-btn')
const orderDialogCloseBtn = orderDialogNode.querySelector('button')



orderDialogCloseBtn.addEventListener('click', () => orderDialogNode.close())

// Web operations
async function fetchRestaurants() {
  const response = await fetch(`${BASE_URL}/restaurants`, {
    method: 'GET',
  })

  return await response.json()
}

async function fetchOrders() {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'GET',
  })

  return await response.json()
}

// Components
function buildRestaurantNode(restaurant) {
  const rootArticle = document.createElement('article')

  const orderDialog = buildMenuDialog(restaurant)

  const fmtCountry = formatCountry(restaurant.address.countryCode)
  const fmtTags = restaurant.food.map(
    (foodType) => `<kbd>${foodTypeMap[foodType] ?? foodType}</kbd>`
  )

  /**
   * @todo: To be implemented, see restaurantHasPromotion below
   done*/

  const discountNodeHtml = '<ins>Desconto!</ins>'
  const showPromo = restaurantHasPromotion(restaurant)
  

  // if (showPromo === true){
  //   rootArticle.innerHTML = `
  //   <div class="flex-row" style="justify-content: space-between;">
  //     <h3>${restaurant.name}</h3> ${discountNodeHtml}
  //   </div> 
  //   <figure>
  //     <img src="${restaurant.photoUrl}">
  //     <figcaption><div class="flex-row flex-gap-sm">${fmtTags.join(
  //       ''
  //     )}</div></figcaption>
  //   </figure>
  // `
  // } else {
  //   rootArticle.innerHTML = `
  //   <div class="flex-row" style="justify-content: space-between;">
  //     <h3>${restaurant.name}</h3>
  //   </div>
  //   <figure>
  //     <img src="${restaurant.photoUrl}">
  //     <figcaption><div class="flex-row flex-gap-sm">${fmtTags.join(
  //       ''
  //     )}</div></figcaption>
  //   </figure>
  // `
  //   }
  

  rootArticle.innerHTML = `
    <div class="flex-row" style="justify-content: space-between;">
      <h3>${restaurant.name}</h3>${showPromo ? discountNodeHtml : ""}
    </div>
    <figure>
      <img src="${restaurant.photoUrl}">
      <figcaption><div class="flex-row flex-gap-sm">${fmtTags.join(
        ''
      )}</div></figcaption>
    </figure>
  `

  const footerNode = document.createElement('footer')
  const footerNavNode = document.createElement('nav')
  footerNavNode.innerHTML = `
    <div class="flex-col flex-gap-sm">
      <small>${restaurant.address.street} • ${restaurant.address.postCode} ${restaurant.address.city}</small>
      <small>${fmtCountry}</small>
    </div>
  `

  const orderBtnNode = document.createElement('button')
  orderBtnNode.type = 'button'
  orderBtnNode.innerText = 'Encomendar'
  orderBtnNode.addEventListener('click', () => orderDialog.showModal())

  footerNavNode.appendChild(orderBtnNode)
  footerNode.appendChild(footerNavNode)
  rootArticle.appendChild(footerNode)
  rootArticle.appendChild(orderDialog)

  return rootArticle
}

function buildMenuDialog(restaurant) {
  const dialog = document.createElement('dialog')
  const menuItemForm = document.createElement('form')

  dialog.appendChild(menuItemForm)

  const menuItemGridNode = document.createElement('div')
  menuItemGridNode.classList.add('grid', 'xs')

  /**
   * @todo: BUG HERE!! We're showing menu items without stock and allowing customers to order them!
   */
  restaurant.menu.forEach((menuItem) => {
    const node = buildMenuItem(menuItem, restaurant.currency, menuItemForm)

    menuItemGridNode.appendChild(node)
  })

  const menuItemMain = document.createElement('article')
  const menuItemHeader = document.createElement('header')
  menuItemHeader.innerHTML = `<h2>${restaurant.name}</h2>`

  menuItemMain.appendChild(menuItemHeader)
  menuItemMain.appendChild(menuItemGridNode)

  const menuItemFooter = document.createElement('footer')
  menuItemFooter.classList.add('flex-row')
  menuItemFooter.style.justifyContent = 'flex-end'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.innerText = 'Fechar'
  closeBtn.addEventListener('click', () => dialog.close())

  const submitBtn = document.createElement('button')
  submitBtn.type = 'submit'
  submitBtn.innerText = 'Encomendar'
  submitBtn.disabled = true

  // The form listens for the custom event "cart-change", triggered by the menu item buttons
  menuItemForm.addEventListener('cart-change', (e) => {
    const newQty = e.detail

    if (newQty > 0) {
      submitBtn.disabled = false
    } else {
      submitBtn.disabled = true
    }
  })

  menuItemForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    submitBtn.disabled = true
    submitBtn.ariaBusy = true
    submitBtn.innerText = '...'

    try {
      await submitOrder(restaurant, menuItemForm)
    } catch (err) {
      console.error('Something went wrong', err)
    }

    submitBtn.ariaBusy = false
    submitBtn.innerText = 'Encomenda submetida com sucesso! 💸'
  })

  menuItemFooter.appendChild(submitBtn)
  menuItemFooter.appendChild(closeBtn)
  menuItemMain.appendChild(menuItemFooter)

  menuItemForm.appendChild(menuItemMain)

  return dialog
}

function buildMenuItem(menuItem, currency, formNode) {
  const mainNode = document.createElement('div')
  mainNode.classList.add('flex-row', 'flex-gap-sm')

  const finalPrice = calculateMenuItemPrice(menuItem)
  const isDiscounted = menuItem.basePrice !== finalPrice

  const [fmtFinalPrice, fmtBasePrice] = [
    formatPrice(finalPrice, currency),
    formatPrice(menuItem.basePrice, currency),
  ]

  let discountHtml = ''
  if (isDiscounted) {
    discountHtml = `<p><s>${fmtBasePrice}</s> <mark>${fmtFinalPrice}</mark><p>`
  } else {
    discountHtml = `<p>${fmtBasePrice}</p>`
  }

  mainNode.innerHTML = `
    <img src="${menuItem.photoUrl}">
    <div class="flex-col" style="width: 100%">
      <hgroup>
         <h4>${menuItem.name}</h4>
         ${discountHtml}
      </hgroup>
      <kbd>${categoryTypeMap[menuItem.category] ?? menuItem.category}</kbd>
      <p>${menuItem.description}</p>
    </div>
    <input type="hidden" name="${menuItem.id}" value="0">
  `

  const actionsNode = buildMenuItemActions(menuItem, formNode)

  mainNode.appendChild(actionsNode)

  return mainNode
}

function buildMenuItemActions(menuItem, formNode) {
  const actionsNode = document.createElement('div')
  actionsNode.classList.add('flex-row', 'flex-gap-sm')
  actionsNode.style.alignItems = 'baseline'

  const quantityNode = document.createElement('span')
  const addToCartBtn = createButton('+', { type: 'button' })
  const removeFromCartBtn = createButton('-', { type: 'button' })

  actionsNode.appendChild(addToCartBtn)
  actionsNode.appendChild(quantityNode)
  actionsNode.appendChild(removeFromCartBtn)

  quantityNode.innerText = "0"
  removeFromCartBtn.disabled = true
  
  const handleAfterChange = (input, newQty) => {
    input.value = String(newQty)
    quantityNode.innerText = newQty

    const cartChangeEvent = new CustomEvent('cart-change', { bubbles: true, detail: newQty })
    actionsNode.dispatchEvent(cartChangeEvent)
  }

  addToCartBtn.addEventListener('click', () => {
    const menuItemInput = getMenuItemInput(menuItem.id, formNode)

    const newQty = Number(menuItemInput.value ?? 0) + 1

    if (newQty > 0) removeFromCartBtn.disabled = false

    handleAfterChange(menuItemInput, newQty)
  })

  removeFromCartBtn.addEventListener('click', () => {
    const menuItemInput = getMenuItemInput(menuItem.id, formNode)

    const newQty = Number(menuItemInput.value ?? 0) - 1

    if (newQty === 0) removeFromCartBtn.disabled = true
    if (newQty < 0) return

    handleAfterChange(menuItemInput, newQty)
  })

  return actionsNode
}

function createButton(text, props = { type: 'button' }) {
  const btnNode = document.createElement('button')

  btnNode.type = props.type
  btnNode.innerText = text
  
  for (const [k, v] of Object.entries(props.style ?? {})) {
    btnNode.style[k] = v
  }

  return btnNode
}

// Utilities
function calculateMenuItemPrice(menuItem) {
  let price = menuItem.basePrice

  for (const promotion of menuItem.promotions) {
    switch (promotion.type) {
      case 'percent-off':
        price -= price * (promotion.amount / 100)
        break
      case 'price-off':
        price -= promotion.amount
        break
    }
  }

  return price
}

function formatPrice(amount, currency) {
  return new Intl.NumberFormat(['pt'], { currency, style: 'currency' }).format(
    amount
  )
}

function formatCountry(countryCode) {
  return new Intl.DisplayNames(['pt'], { type: 'region' }).of(countryCode)
}

function getMenuItemInput(menuItemId, formNode) {
  const formInputs = formNode.querySelectorAll('input')

  return Array.from(formInputs).find((input) => input.name === menuItemId)
}

// Handlers
async function submitOrder(restaurant, formNode) {
  const formData = new FormData(formNode)

  const selectedItems = []
  for (const [itemId, qty] of formData.entries()) {
    const numQty = Number(qty)

    if (!isFinite(Number(numQty)) || numQty <= 0) continue

    const menuItem = restaurant.menu.find((mi) => mi.id === itemId)

    if (!menuItem) continue

    selectedItems.push({ menuItemId: menuItem.id, quantity: numQty })
  }

  const payload = JSON.stringify({
    restaurantId: restaurant.id,
    items: selectedItems,
  })

  return await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  })
}

// Setup
function renderRestaurantList(restaurants) {
  restaurantListNode.innerHTML = ''

  for (const restaurant of restaurants) {
    const restaurantNode = buildRestaurantNode(restaurant)

    restaurantListNode.appendChild(restaurantNode)
  }
}

function renderOrderTable(orders, restaurants) {
  const tableBodyNode = orderDialogNode.querySelector('tbody')

  tableBodyNode.innerHTML = ''

  for (const order of orders) {
    const restaurant = restaurants.find((r) => r.id === order.restaurantId)
    const rowNode = document.createElement('tr')

    rowNode.innerHTML = `
      <td>${order.id}</td>
      <td>${restaurant.name ?? order.restaurantId}</td>
      <td>${order.status}</td>
      <td>${order.items.length}</td>
      <td>${formatPrice(order.price, order.currency)}</td>
    `

    tableBodyNode.appendChild(rowNode)
  }
}

setupSearch()

fetchRestaurants().then((restaurants) => {
  renderRestaurantList(restaurants)

  restaurantSearchForm.addEventListener('submit', (e) => {
    e.preventDefault()

    handleRestaurantSearch(restaurants)
  })

  orderDialogOpenBtn.addEventListener('click', async () => {
    const orders = await fetchOrders()

    renderOrderTable(orders, restaurants)
    orderDialogNode.showModal()
  })
})


// ------ O TEU CÓDIGO AQUI --------------

/**
 * 
 * @todo: Implement restaurant search function. It should support:
 * - Searching by name
 * - Searching by country
 * - Searching by (one or more) food types
 * - If a field is empty, we should not consider it for matching (e.g. empty fields match all)
 * DONE
 */

function handleRestaurantSearch(restaurants) {
  const searchFormData = new FormData(restaurantSearchForm)
  
  const nameSearched = searchFormData.get("name").toLowerCase().trim()
  const countrySearched = searchFormData.get("country")
  const foodTypeSearched = Array.from(searchFormData.getAll("food"))

  const filteredRestaurants = []

  const promotionChecked = searchFormData.has("promotion-checkbox")

  for (const i of restaurants){
    const namesFinded = nameSearched === "" || i.name.toLowerCase().includes(nameSearched)
    const countriesFinded = countrySearched ==="" || i.address.countryCode === countrySearched
    const typeFinded = foodTypeSearched.length === 0 || foodTypeSearched.some((type) => i.food.includes(type))
    const hasPromotion = !promotionChecked || restaurantHasPromotion(i)

     if (namesFinded && countriesFinded && typeFinded && hasPromotion) {
      filteredRestaurants.push(i);
    }
  }

  renderRestaurantList(filteredRestaurants)

  // console.log('handleRestaurantSearch - NOT IMPLEMENTED')
}

/**
 * 
 * @todo - Implement function to determine if a restaurant has an active promotion
 done*/
function restaurantHasPromotion(restaurant) {

  for (const i of restaurant.menu){

    if (i.promotions.length > 0) {
      return true;
    }
  }
  
  return false

  // console.log('restaurantHasPromotion - NOT IMPLEMENTED')
}