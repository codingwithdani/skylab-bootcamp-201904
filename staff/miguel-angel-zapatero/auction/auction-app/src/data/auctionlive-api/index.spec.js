import auctionLiveApi from '.'
import { mongoose, models } from 'auction-data'
import { RequirementError, ValueError, FormatError } from 'auction-errors'
import bcrypt from  'bcrypt'
import jwt from 'jsonwebtoken'

// jest.setTimeout(100000)

const { User, Item, Bid } = models

const {env: { MONGO_URL_LOGIC_TEST }} = process

describe('auctionlive-api', () => {
    beforeAll(async () => {
        try {
            await mongoose.connect(MONGO_URL_LOGIC_TEST, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true })
            
            console.log('connected to database')
        } catch (error) {
            console.log(error, error.message)
        }
    })

    let name, surname, email, password

    beforeEach(async () => {
        const users = new Array(10).fill().map(item => item = {
            name: `Peter-${Math.random()}`,
            surname: `Parker-${Math.random()}`,
            email: `pparker-${Math.random()}@mail.com`,
            password: `${Math.random()}`
        })
        
        const user = users[Math.floor(Math.random() * users.length)]

        name = user.name
        surname = user.surname
        email = user.email
        password = user.password
        
        await User.deleteMany()
        await Item.deleteMany()
        await Bid.deleteMany()
    })

    describe('users', () => {
        describe('register user', () => {
            it('should success on correct data', async () => {
                const res = await auctionLiveApi.registerUser(name, surname, email, password)
                expect(res).toBeDefined()
                expect(res.message).toBe('Ok, user registered.')

                const user = await User.findOne({email})
                
                const samePass = bcrypt.compareSync(password, user.password)

                expect(user.name).toBe(name)
                expect(user.surname).toBe(surname)
                expect(user.email).toBe(email)
                expect(samePass).toBe(true)
            })

            it('should fail on already user exists', async () => {
                try {
                    await User.create({name, surname, email, password})   
                    await auctionLiveApi.registerUser(name, surname, email, password)
                    throw Error('should not reach this point')
                } catch (error) {
                    expect(error).toBeInstanceOf(Error)
                    expect(error.message).toBe(`user with email "${email}" already exist`)
                }
            })

            it('should fail on undefined name', () => {
                const name = undefined

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(RequirementError, `name is not optional`)
            })

            it('should fail on null name', () => {
                const name = null

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(RequirementError, `name is not optional`)
            })

            it('should fail on empty name', () => {
                const name = ''

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(ValueError, 'name is empty')
            })

            it('should fail on blank name', () => {
                const name = ' \t    \n'

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(ValueError, 'name is empty')
            })

            it('should fail on undefined surname', () => {
                const surname = undefined

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(RequirementError, `surname is not optional`)
            })

            it('should fail on null surname', () => {
                const surname = null

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(RequirementError, `surname is not optional`)
            })

            it('should fail on empty surname', () => {
                const surname = ''

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(ValueError, 'surname is empty')
            })

            it('should fail on blank surname', () => {
                const surname = ' \t    \n'

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(ValueError, 'surname is empty')
            })

            it('should fail on undefined email', () => {
                const email = undefined

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(RequirementError, `email is not optional`)
            })

            it('should fail on null email', () => {
                const email = null

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(RequirementError, `email is not optional`)
            })

            it('should fail on empty email', () => {
                const email = ''

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(ValueError, 'email is empty')
            })

            it('should fail on blank email', () => {
                const email = ' \t    \n'

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(ValueError, 'email is empty')
            })

            it('should fail on non-email email', () => {
                const nonEmail = 'non-email'

                expect(() => auctionLiveApi.registerUser(name, surname, nonEmail, password)).toThrowError(FormatError, `${nonEmail} is not an e-mail`)
            })

            it('should fail on undefined password', () => {
                const email = undefined

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(RequirementError, `password is not optional`)
            })

            it('should fail on null password', () => {
                const password = null

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(RequirementError, `password is not optional`)
            })

            it('should fail on empty password', () => {
                const password = ''

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(ValueError, 'password is empty')
            })

            it('should fail on blank password', () => {
                const password = ' \t    \n'

                expect(() => auctionLiveApi.registerUser(name, surname, email, password)).toThrowError(ValueError, 'password is empty')
            })
        })

        describe('after created user', () =>{
            let user, _password, token

            beforeEach(async() => {
                _password = bcrypt.hashSync(password, 10)
                user = await User.create({name, surname, email, password: _password})
               
                const res = await auctionLiveApi.authenticateUser(email, password)
                token = res.token    
            })

            describe('authenticate user', () => {
                it('should success on correct data', async () => {
                    const _token = await auctionLiveApi.authenticateUser(email, password)
                    
                    let {sub} = jwt.decode(_token.token)
                    
                    expect(sub).toBe(user.id)
                })

                it('should fail on non-existing user', async () => {
                    try {
                        await auctionLiveApi.authenticateUser(email = 'unexisting-user@mail.com', password)
                        throw Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe(`user with email "${email}" doesn't exist`)
                    }
                })

                it('should fail on wrong password', async () => {
                    try {
                        await auctionLiveApi.authenticateUser(email, password = '123')
                        throw Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe('wrong credentials')
                    }
                })
            })

            describe('retrieve user', () => {
                it('should success on correct user token', async () => {
                   
                    const _user = await auctionLiveApi.retrieveUser(token)

                    expect(_user.id).toBeUndefined()
                    expect(_user.name).toBe(user.name)
                    expect(_user.surname).toBe(user.surname)
                    expect(_user.email).toBe(user.email)
                    expect(_user.password).toBeUndefined()
                })

                it('should fail on invalid token', async () => {
                    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1Y2YwNWRiMTlhOWFkMDE2MGMxODhlYmMiLCJpYXQiOjE1NTkyNTY1MDEsImV4cCI6MTU1OTI2MDEwMX0.HXQ4YMq6bdsXfQQthBKKZ4sdfsdfsXUOCF3xdqs1h69F7bg'
    
                    try {
                        await auctionLiveApi.retrieveUser(token) 
                        throw Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe('invalid signature')
                    }
                })
    
                it('should fail on wrong token', async () => {
                    token = 'wrong-id'
    
                    try {
                        await auctionLiveApi.retrieveUser(token) 
                        throw Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)                        
                        expect(error.message).toBe('jwt malformed')
                    }
                })
            })

            describe('update', () => {        
                let data

                beforeEach(async () => {
                    data = { name: 'n', surname: 's', email: 'e@e.com', password: 'p'}
                })

                it('should succeed on correct data', async () => {    
                    const response = await auctionLiveApi.updateUser(token, data)
                    expect(response).toBeDefined()
                    expect(response.message).toBe('Ok, user updated.')
                    
                    const _user = await User.findById(user.id)
                    
                    expect(_user).toBeDefined()
                    expect(_user.id).toBe(user.id)
                    expect(_user.surname).toBe(data.surname)
                    expect(_user.name).toBe(data.name)
                    expect(_user.email).toBe(data.email)

                    const pass = bcrypt.compareSync(data.password, _user.password)

                    expect(pass).toBeTruthy()
                    expect(Object.keys(_user._doc).length).toEqual(Object.keys(user._doc).length)
                })

                it('should succeed changing some fields', async () => {    
                    const data = { name: 'n', email: 'e@e.com'}
    
                    const response = await auctionLiveApi.updateUser(token, data)
                    expect(response).toBeDefined()
                    expect(response.message).toBe('Ok, user updated.')
                    
                    const _user = await User.findById(user.id)
                    
                    expect(_user).toBeDefined()
                    expect(_user.id).toBe(user.id)
                    expect(_user.name).toBe(data.name)
                    expect(_user.email).toBe(data.email)
                    
                    expect(_user.name).not.toBe(user.name)
                    expect(_user.email).not.toBe(user.email)
                    expect(_user.surname).toBe(user.surname)
                    expect(_user.password).toBe(user.password)
    
                    expect(Object.keys(_user._doc).length).toEqual(Object.keys(user._doc).length)
                })
    
                it('should fail on incorrect user token', async () => {    
                    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1Y2YwNWRiMTlhOWFkMDE2MGMxODhlYmMiLCJpYXQiOjE1NTkyNTY1MDEsImV4cCI6MTU1OTI2MDEwMX0.HXQ4YMq6bdsXfQQthBKKZ4sdfsdfsXUOCF3xdqs1h69F7bg'
    
                    try {
                        await auctionLiveApi.updateUser(token, data) 
                        throw Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe('invalid signature')
                    }
                })
                
                it('should fail on wrong token', async () => {    
                    let id = 'wrong-id'
    
                    try {
                        await auctionLiveApi.updateUser(id, data)
                        throw Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe('jwt malformed')
                    }
                })

                it('should fail on existing email user', async () => {    
                    await User.create({name, surname, email: 'email@mail.com', password: _password}) 

                    data.email = 'email@mail.com'
    
                    try {
                        await auctionLiveApi.updateUser(token, data) 
                        throw Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe(`email "${data.email}" already exist`)
                    }
                })
            })
        
            describe('delete', () => {
                it('should succed on correct token', async () => {
                    const response = await auctionLiveApi.deleteUser(token, user.email, password)
                    expect(response).toBeDefined()
                    expect(response.message).toBe('Ok, user deleted.')

                    const _user = await User.findById(user.id)

                    expect(_user).toBeNull()
                })

                it('should fail on already deleted user', async () => {
                    let {sub} = jwt.decode(token)
                    
                    try {
                        await auctionLiveApi.deleteUser(token, user.email, password)

                        await auctionLiveApi.deleteUser(token, user.email, password)
                        throw new Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe(`user with id "${sub}" does not exist`)
                    }
                })
        
                it('should fail on incorrect token', async () => {
                    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1Y2YwNWRiMTlhOWFkMDE2MGMxODhlYmMiLCJpYXQiOjE1NTkyNTY1MDEsImV4cCI6MTU1OTI2MDEwMX0.HXQ4YMq6bdsXfQQthBKKZ4sdfsdfsXUOCF3xdqs1h69F7bg'

                    try {
                        await auctionLiveApi.deleteUser(token, user.email, user.password)
                        throw new Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe('invalid signature')
                    }
                })

                it('should fail on wrong token', async () => {    
                    token = 'wrong-token'
    
                    try {
                        await auctionLiveApi.deleteUser(token, user.email, user.password)
                        throw Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe('jwt malformed')
                    }
                })
    
                it('should fail on incorrect email', async () => {
                    let email = 'fake_email@gmail.com' 
    
                    try {
                        await auctionLiveApi.deleteUser(token, email, user.password)
                        throw new Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe('wrong credentials')
                    }
                })
    
                it('should fail on incorrect password', async () => {
                    let password = '423'
    
                    try {
                        await auctionLiveApi.deleteUser(token, user.email, password)
                        throw new Error('should not reach this point')
                    } catch (error) {
                        expect(error).toBeDefined()
                        expect(error).toBeInstanceOf(Error)
                        expect(error.message).toBe('wrong credentials')
                    }
                })
            })
        })
    })

    describe('items', () => {
        let items, sDate, fDate
        const cities = ['Japan', 'London', 'New York', 'Spain']
        const categories = ['Art', 'Cars', 'Jewellery', 'Watches']

        beforeEach(async () => {
            items = new Array(25).fill().map(item => {
                sDate = new Date
                fDate = new Date

                return item = {
                    title: `Car-${Math.random()}`,
                    description: `description-${Math.random()}`,
                    startPrice: Math.ceil(Math.random() * 200),
                    startDate: sDate.setDate(sDate.getDate() + (Math.floor(Math.random() * 3))),
                    finishDate: fDate.setDate(fDate.getDate() + (Math.floor(Math.random() * 5) + 3)),
                    reservedPrice: Math.floor(Math.random() * 1),
                    city: cities[Math.floor(Math.random() * cities.length)],
	                category: categories[Math.floor(Math.random() * categories.length)],
	                images: "image1.jpg"
                }
            })

            await Promise.all(items.map(async item => await Item.create(item)))
        })

        xdescribe('create items', () => {
            it('should success on correct data', async () => {
                let item = items[Math.floor(Math.random() * items.length)]
                
                let { title, description, startPrice, startDate, finishDate, reservedPrice, city, category, images } = item

                startDate = new Date(startDate)
                finishDate = new Date(finishDate)
                
                await auctionLiveApi.createItem(title, description, startPrice, startDate, finishDate, reservedPrice, images, category, city)
                
                const _item = await Item.findOne({title: title})
                
                expect(_item.title).toBe(title)
                expect(_item.description).toBe(description)
                expect(_item.startPrice).toBe(startPrice)
                expect(_item.startDate).toEqual(startDate)
                expect(_item.finishDate).toEqual(finishDate)
                expect(_item.reservedPrice).toBe(reservedPrice)
                expect(_item.city).toBe(city)
                expect(_item.category).toBe(category)
                expect(_item.images).toBeInstanceOf(Array)
                // expect(_item.images).toContain(images)
            })
        })

        describe('search items', () => {
            let query

            beforeEach(() => {
                query = {}
            })

            it('should success on correct city', async () => {
                let items_ = items.filter(item => item.city === 'Japan')
                query.city = 'Japan'

                const _items = await auctionLiveApi.searchItems(query)

                expect(_items).toBeInstanceOf(Array)
                expect(_items).toHaveLength(items_.length)
            })

            it('should success on correct category', async () => {
                let items_ = items.filter(item => item.category === 'Art')
                query.category = 'Art'

                const _items = await auctionLiveApi.searchItems(query)

                expect(_items).toBeInstanceOf(Array)
                expect(_items).toHaveLength(items_.length)
            })

            it('should success on correct finish range date', async () => { 
                sDate = new Date
                fDate = new Date
                sDate.setDate(sDate.getDate() + (Math.floor(Math.random() * 3)))
                fDate.setDate(fDate.getDate() + (Math.floor(Math.random() * 5) + 3))

                let items_ = items.filter(item => (item.finishDate >= sDate && item.finishDate <= fDate))

                query.startDate = sDate
                query.endDate = fDate

                const _items = await auctionLiveApi.searchItems(query)

                expect(_items).toBeInstanceOf(Array)
                expect(_items).toHaveLength(items_.length)
            })

            it('should success on correct start price range', async () => {
                let items_ = items.filter(item => (item.startPrice >= 20 && item.startPrice <= 150))

                query.startPrice = 21 
                query.endPrice = 149 

                const _items = await auctionLiveApi.searchItems(query)

                expect(_items).toBeInstanceOf(Array)
                expect(_items).toHaveLength(items_.length)
            })

            it('should success on correct on multiple data', async () => {
                let items_ = items.filter(item => (item.startPrice >= 20 && item.startPrice <= 150) && (item.city === 'London') && (item.category === 'Jewellery'))

                query.city = 'London'
                query.category = 'Jewellery'
                query.startPrice = 21 
                query.endPrice = 149 

                const _items = await auctionLiveApi.searchItems(query)
                
                expect(_items).toBeInstanceOf(Array)
                expect(_items).toHaveLength(items_.length)
            })

            it('should list all items with empty query', async () => {
                const _items = await auctionLiveApi.searchItems(query)

                expect(_items).toBeInstanceOf(Array)
                expect(_items.length).toBe(25)
            })
        })

        describe('retrieve item', () => {
            it('should success on correc item id', async () => {
                let item_ = items[Math.floor(Math.random() * items.length)]
                const item = await Item.create(item_)

                const _item = await auctionLiveApi.retrieveItem(item.id)
                
                let startDate = new Date(_item.startDate)
                let finishDate = new Date(_item.finishDate)

                expect(_item.title).toBe(item.title)
                expect(_item.description).toBe(item.description)
                expect(_item.startPrice).toBe(item.startPrice)
                expect(startDate).toEqual(item.startDate)
                expect(finishDate).toEqual(item.finishDate)
                expect(_item.reservedPrice).toBe(item.reservedPrice)
                expect(_item.city).toBe(item.city)
                expect(_item.category).toBe(item.category)
                expect(_item.images).toBeInstanceOf(Array)
            })
        })

        describe('retrieve cities', () => {
            it('should success and not repeat values', async() => {
                const _cities = await auctionLiveApi.retrieveCities()

                expect(_cities).toBeDefined()
                expect(_cities).toBeInstanceOf(Array)
                expect(_cities).toEqual(expect.arrayContaining(cities))
            })
        })

        describe('retrieve categories', () => {
            it('should success and not repeat values', async() => {
                const _categories = await auctionLiveApi.retrieveCategories()

                expect(_categories).toBeDefined()
                expect(_categories).toBeInstanceOf(Array)
                expect(_categories).toEqual(expect.arrayContaining(categories))
            })
        })
    })

    describe('bids', () => {
        let item, user, token, _password

        const cities = ['Japan', 'New York', 'Spain', 'London']
        const categories = ['Art', 'Cars', 'Jewellery', 'Watches']
        
        beforeEach(async () => {
            item = await Item.create({
                title: `Car-${Math.random()}`,
                description: `description-${Math.random()}`,
                startPrice: Math.floor(Math.random() * 200) + 10,
                startDate: Date.now(),
                finishDate: Date.now() + (Math.ceil(Math.random() * 1000000000)),
                reservedPrice: Math.floor(Math.random() * 1),
                city: cities[Math.floor(Math.random() * cities.length)],
	            category: categories[Math.floor(Math.random() * categories.length)],
	            images: "image1.jpg"
            })
            
            _password = bcrypt.hashSync(password, 10)
            user = await User.create({name, surname, email, password: _password})

            const res = await auctionLiveApi.authenticateUser(email, password)
            token = res.token   
        })

        describe('place a bid', () => {
            it('should success on correct data when bidding first time', async () => {
                let amount = 1000

                await auctionLiveApi.placeBid(item.id, token, amount)
                const _item = await Item.findById(item.id)
                const _user = await User.findById(user.id)

                expect(_item.bids).toBeInstanceOf(Array)
                expect(_item.bids.length).toBeGreaterThan(0)
                
                expect(_item.bids[0].userId.toString()).toBe(user.id)
                expect(_item.bids[0].amount).toBe(amount)
                expect(_item.bids[0].timeStamp).toBeDefined()
                
                expect(_user.items).toBeInstanceOf(Array)
                expect(_user.items.length).toBeGreaterThan(0)
                expect(_user.items[0].toString()).toBe(item.id)
            })

            it('should success on correct data when bidding second time', async () => {
                let amount = 1000
                await auctionLiveApi.placeBid(item.id, token, amount)

                let amount2 = 2000
                await auctionLiveApi.placeBid(item.id, token, amount2)

                const _item = await Item.findById(item.id)
                const _user = await User.findById(user.id)
                
                expect(_item.bids).toBeInstanceOf(Array)
                expect(_item.bids.length).toBeGreaterThan(1)
                expect(_item.bids[0].userId.toString()).toBe(user.id)
                expect(_item.bids[0].amount).toBe(amount2)
                expect(_item.bids[0].timeStamp).toBeDefined()
                expect(_item.bids[1].userId.toString()).toBe(user.id)
                expect(_item.bids[1].amount).toBe(amount)
                expect(_item.bids[1].timeStamp).toBeDefined()

                expect(_user.items).toBeInstanceOf(Array)
                expect(_user.items.length).toBeLessThan(2)
                expect(_user.items[0].toString()).toBe(item.id)
            })

            it('should fail if the bid is lower than the start price', async () => {
                let amount = 5
                try {
                    await auctionLiveApi.placeBid(item.id, token, amount)
                    throw new Error('should not reach this point')
                } catch (error) {
                    debugger
                    expect(error).toBeDefined()
                    expect(error).toBeInstanceOf(Error)
    
                    expect(error.message).toBe(`sorry, the current bid "${amount}" is lower than the start price`)
                }
            })

            it('should fail if the bid is lower than the current bid', async () => {
                let amount = 2000
                try {
                    await auctionLiveApi.placeBid(item.id, token, amount)
                    
                    amount = 1000
                    await auctionLiveApi.placeBid(item.id, token, amount)
                    
                    throw new Error('should not reach this point')
                } catch (error) {
                    expect(error).toBeDefined()
                    expect(error).toBeInstanceOf(Error)
    
                    expect(error.message).toBe(`sorry, the bid "${amount}" is lower than the current amount`)
                }
            })

            it('should fail on incorrect item id', async () => {
                let amount = 2000
                let id = '01234567890123456789abcd'
                
                try {
                    await auctionLiveApi.placeBid(id, token, amount)                    
                    throw new Error('should not reach this point')
                } catch (error) {
                    expect(error).toBeDefined()
                    expect(error).toBeInstanceOf(Error)
    
                    expect(error.message).toBe(`item with id "${id}" doesn't exist`)
                }
            })

            it('should fail on incorrect item id', async () => {
                let amount = 2000
                let id = 'wrong-id'
                
                try {
                    await auctionLiveApi.placeBid(id, token, amount)                    
                    throw new Error('should not reach this point')
                } catch (error) {
                    expect(error).toBeDefined()
                    expect(error).toBeInstanceOf(Error)
                    expect(error.message).toBe(`Cast to ObjectId failed for value "wrong-id" at path "_id" for model "Item"`)
                }
            })

            it('should fail on incorrect user token', async () => {
                let amount = 2000
                token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1Y2YwNWRiMTlhOWFkMDE2MGMxODhlYmMiLCJpYXQiOjE1NTkyNTY1MDEsImV4cCI6MTU1OTI2MDEwMX0.HXQ4YMq6bdsXfQQthBKKZ4sdfsdfsXUOCF3xdqs1h69F7bg'
                
                try {
                    await auctionLiveApi.placeBid(item.id, token, amount)                    
                    throw new Error('should not reach this point')
                } catch (error) {
                    expect(error).toBeDefined()
                    expect(error).toBeInstanceOf(Error)
                    expect(error.message).toBe('invalid signature')
                }
            })

            it('should fail on incorrect user token', async () => {
                let amount = 2000
                let token = 'wrong-id'
                
                try {
                    await auctionLiveApi.placeBid(item.id, token, amount)                    
                    throw new Error('should not reach this point')
                } catch (error) {
                    expect(error).toBeDefined()
                    expect(error).toBeInstanceOf(Error)
                    expect(error.message).toBe('jwt malformed')
                }
            })

        })

        describe('retrieve item bids', () => {
            it('should success on correct item id', async () => {
                let amount = 1000
                await auctionLiveApi.placeBid(item.id, token, amount)

                let amount2 = 1500
                await auctionLiveApi.placeBid(item.id, token, amount2)

                const bids = await auctionLiveApi.retrieveItemBids(item.id, token)
                
                expect(bids.length).toBeGreaterThan(0)

                expect(bids[0].amount).toBe(amount2)
                expect(bids[0].timeStamp).toBeDefined()
                expect(bids[0].userId.name).toBe(user.name)
                expect(bids[0].userId.name).toBe(user.name)
                expect(bids[0].userId.name).toBe(user.name)
                expect(bids[0].userId.password).toBeUndefined()
                expect(bids[0].userId._id).toBeUndefined()

                expect(bids[1].amount).toBe(amount)
                expect(bids[1].timeStamp).toBeDefined()
                expect(bids[1].userId.name).toBe(user.name)
                expect(bids[1].userId.surname).toBeUndefined()
                expect(bids[1].userId.email).toBeUndefined()
                expect(bids[1].userId.password).toBeUndefined()
                expect(bids[1].userId._id).toBeUndefined()
            })

            it('should fail on incorrect item id', async () => {
                let id = '01234567890123456789abcd'
                
                try {
                    await auctionLiveApi.retrieveItemBids(id, token)                   
                    throw new Error('should not reach this point')
                } catch (error) {
                    expect(error).toBeDefined()
                    expect(error).toBeInstanceOf(Error)
                    debugger
                    expect(error.message).toBe(`item with id "${id}" doesn't exist`)
                }
            })

            it('should fail on wrong item id', async () => {
                let id = 'wrong-id'
                
                try {
                    await auctionLiveApi.retrieveItemBids(id, token)                    
                    throw new Error('should not reach this point')
                } catch (error) {
                    expect(error).toBeDefined()
                    expect(error).toBeInstanceOf(Error)
                    expect(error.message).toBe(`Cast to ObjectId failed for value "wrong-id" at path "_id" for model "Item"`)
                }
            })

            it('should fail on incorrect user token', async () => {
                let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1Y2YwNWRiMTlhOWFkMDE2MGMxODhlYmMiLCJpYXQiOjE1NTkyNTY1MDEsImV4cCI6MTU1OTI2MDEwMX0.HXQ4YMq6bdsXfQQthBKKZ4sdfsdfsXUOCF3xdqs1h69F7bg'
                
                try {
                    await auctionLiveApi.retrieveItemBids(item.id, token)              
                    throw new Error('should not reach this point')
                } catch (error) {
                    expect(error).toBeDefined()
                    expect(error).toBeInstanceOf(Error)
    
                    expect(error.message).toBe('invalid signature')
                }
            })

            it('should fail on wrong user token', async () => {
                let token = 'wrong-id'
                
                try {
                    await auctionLiveApi.retrieveItemBids(item.id, token)                    
                    throw new Error('should not reach this point')
                } catch (error) {
                    expect(error).toBeDefined()
                    expect(error).toBeInstanceOf(Error)
                    expect(error.message).toBe("jwt malformed")
                }
            })
        })
    })

    afterAll(() => mongoose.disconnect())
})