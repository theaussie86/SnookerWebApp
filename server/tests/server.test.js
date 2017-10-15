const expect = require('expect');
const request = require('supertest');
const {ObjectID}=require('mongodb');

const {app} = require('./../server');
const {Rent} = require('./../models/rent');
const {User} = require('./../models/user');
const {rents, populateRents, users, populateUsers}=require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateRents);

describe('RENT ROUTES',()=>{
    describe('POST /rents', ()=>{
        it('should create a new rent', (done)=>{
            var rent={
                datum: "9.14.2017",
                player1: "Flo",
                player2: "Murat",
                start: "19:30",
                ende: "22:45"
            };
            request(app)
                .post('/rents')
                .set('x-auth', users[0].tokens[0].token)
                .send(rent)
                .expect(200)
                .expect((res)=>{
                    expect(res.body.player2).toBe(rent.player2);
                })
                .end((err, res)=>{
                    if (err) {
                        return done(err);
                    }
                    Rent.find().then((rents)=>{
                        expect(rents.length).toBe(3);
                        expect(rents[2].player1).toBe(rent.player1);
                        done();
                    }).catch((e)=>done(e));
                });
        });

        it('should not create rent with invalid body data', (done)=>{
            request(app)
            .post('/rents')
            .set('x-auth', users[0].tokens[0].token)
            .send({})
            .expect(400)
            .end((err, res)=>{
                if (err) {
                    return done(err);
                }
                Rent.find().then((rents)=>{
                    expect(rents.length).toBe(2);
                    done();
                }).catch((e)=>done(e));
            });
        });
    });

    describe('GET /rents',()=>{
        it('should get all rents', (done)=>{
            request(app)
                .get('/rents')
                .set('x-auth', users[0].tokens[0].token)
                .expect(200)
                .expect((res)=>{
                    expect(res.body.rents.length).toBe(1);
                }).end(done);
        });
    });

    describe('GET /rents/:id',()=>{
        it('should return rent doc', (done)=>{
            request(app)
                .get(`/rents/${rents[0]._id.toHexString()}`)
                .set('x-auth', users[0].tokens[0].token)
                .expect(200)
                .expect((res)=>{
                    expect(res.body.rent.player1).toBe(rents[0].player1);
                })
                .end(done);
        });

        it('should not return rent doc created by other user', (done)=>{
            request(app)
                .get(`/rents/${rents[1]._id.toHexString()}`)
                .set('x-auth', users[0].tokens[0].token)
                .expect(404)
                .end(done);
        });

        it('should return 404 if rent not found', (done)=>{
            var id=new ObjectID();
            request(app)
                .get(`/rents/${id.toHexString()}`)
                .set('x-auth', users[0].tokens[0].token)                
                .expect(404)
                .end(done);
                
        }),

        it('should return 404 for non-Object ids', (done)=>{
            request(app)
                .get(`/rents/hallo123`)
                .set('x-auth', users[0].tokens[0].token)                
                .expect(404)
                .end(done);
        });
    });

    describe('DELETE /rents/:id',()=>{
        it('should remove a rent',(done)=>{
            var hexId = rents[1]._id.toHexString();

            request(app)
                .delete(`/rents/${hexId}`)
                .set('x-auth', users[1].tokens[0].token)
                .expect(200)
                .expect((res)=>{
                    expect(res.body.rent._id).toBe(hexId);
                }).end((err,res)=>{
                    if (err){
                        return done(err);
                    }
                    Rent.findById(hexId).then((rent)=>{
                        expect(rent).toBeFalsy();
                        done();
                    }).catch((e)=>done(e));

                });
        });

        it('should not remove a rent from another user',(done)=>{
            var hexId = rents[0]._id.toHexString();

            request(app)
                .delete(`/rents/${hexId}`)
                .set('x-auth', users[1].tokens[0].token)
                .expect(404)
                .end((err,res)=>{
                    if (err){
                        return done(err);
                    }
                    Rent.findById(hexId).then((rent)=>{
                        expect(rent).toBeTruthy();
                        done();
                    }).catch((e)=>done(e));

                });
        });

        it('should return 404 if rent not found', (done)=>{
            var id=new ObjectID();
            request(app)
                .delete(`/rents/${id.toHexString()}`)
                .set('x-auth', users[1].tokens[0].token)                
                .expect(404)
                .end(done);
        });

        it('should return 404 if object id is invalid',(done)=>{
            request(app)
                .delete(`/rents/hallo123`)
                .set('x-auth', users[1].tokens[0].token)                
                .expect(404)
                .end(done);
        });
    });

    describe('PATCH /rents/:id', ()=>{
        it('should update the rent',(done)=>{
            var hexId = rents[0]._id.toHexString();
            var datum = new Date();
            request(app)
                .patch(`/rents/${hexId}`)
                .set('x-auth', users[0].tokens[0].token)
                .send({
                    paid: true,
                    datum
                })
                .expect(200)
                .expect((res)=>{
                    expect(res.body.rent.paid).toBe(true);
                    expect(res.body.rent.datum).toBe("2017-09-15T22:00:00.000Z");
                    expect(typeof res.body.rent.datum).toBe('string');
                    done();
                }).catch((e)=>done(e));            
        });

        it('should not update rent created by other user',(done)=>{
            var hexId = rents[0]._id.toHexString();
            var datum = new Date();
            request(app)
                .patch(`/rents/${hexId}`)
                .set('x-auth', users[1].tokens[0].token)
                .send({
                    paid: true,
                    datum
                })
                .expect(404)
                .end(done);            
        });

        it('should clear datum when paid is not completed', (done)=>{
            var hexId = rents[1]._id.toHexString();
            var update = {
                paid: false,
                datum: new Date()
            };
            request(app)
                .patch(`/rents/${hexId}`)
                .set('x-auth', users[1].tokens[0].token)                
                .send(update)
                .expect(200)
                .expect((res)=>{
                    expect(res.body.rent.paid).toBe(false);
                    expect(res.body.rent.datum).toBe(null);
                    expect(res.body.rent.datum).toBeFalsy();
                    done();
                }).catch((e)=>done(e)); 
        });
    });
});

describe('USER ROUTES', ()=>{
    describe('GET /users/me', ()=>{
        it('should return a user if authenticates', (done)=>{
            request(app)
                .get('/users/me')
                .set('x-auth', users[0].tokens[0].token)
                .expect(200)
                .expect((res)=>{
                    expect(res.body._id).toBe(users[0]._id.toHexString());
                    expect(res.body.email).toBe(users[0].email);
                    expect(res.body.username).toBe(users[0].username);
                }).end(done);
        });

        it('should return 401 if not authenticated', (done)=>{
            request(app)
                .get('/users/me')
                .expect(401)
                .expect((res)=>{
                    expect(res.body).toEqual({});
                }).end(done);
        });
    });

    describe('POST /users', ()=>{
        it('should create a user', (done)=>{
            var username = 'dude';
            var email = 'du@fake.de';
            var password = '123mnb!';

            request(app)
                .post('/users')
                .send({email, password, username})
                .expect(200)
                .expect((res)=>{
                    expect(res.headers['x-auth']).toBeTruthy();
                    expect(res.body._id).toBeTruthy();
                    expect(res.body.email).toBe(email);
                    expect(res.body.username).toBe(username);
                }).end((err)=>{
                    if (err){
                        return done(err);
                    }

                    User.find({email}).then((user)=>{
                        expect(user).toBeTruthy();
                        expect(user.password).not.toBe(password);
                        done();
                    }).catch((e)=>done(e));
                });

        });

        it('should return validation errors if request invalid', (done)=>{
            var username = 'du';
            var email = 'dufake.de';
            var password = '123mnb!';

            request(app)
                .post('/users')
                .send({email, password, username})
                .expect(400)
                .end(done);
        });

        it('should not create user if email is in use', (done)=>{
            var username = 'dude';
            var email = 'hallo@du.com';
            var password = '123mnb!';

            request(app)
                .post('/users')
                .send({email, password, username})
                .expect(400)
                .end(done);
        });
    });

    describe('POST /users/login', ()=>{
        it('should login user and return auth token', (done)=>{
            request(app)
                .post('/users/login')
                .send({
                    email: users[1].email,
                    password: users[1].password
                })
                .expect(200)
                .expect((res)=>{
                    expect(res.headers['x-auth']).toBeTruthy();
                }).end((err, res)=>{
                    if (err) {
                        return done(err);
                    }

                    User.findById(users[1]._id).then((user)=>{
                        expect(user.toObject().tokens[1]).toMatchObject({
                            access: 'auth',
                            token: res.headers['x-auth']
                        });
                        done();
                    }).catch((e)=>done(e));
                });
        });

        it('should reject invalid login', (done)=>{
            request(app)
                .post('/users/login')
                .send({
                    email: users[1].email,
                    password: 'users[1].password'
                })
                .expect(400)
                .expect((res)=>{
                    expect(res.headers['x-auth']).toBeFalsy();
                }).end((err, res)=>{
                    if (err) {
                        return done(err);
                    }

                    User.findById(users[1]._id).then((user)=>{
                        expect(user.tokens.length).toBe(1);
                        done();
                    }).catch((e)=>done(e));
                });
        });
    });

    describe('DELETE /users/me/token', ()=>{
        it('should remove auth token on logout', (done)=>{
            request(app)
                .delete('/users/me/token')
                .set('x-auth',users[0].tokens[0].token)
                .expect(200)
                .end((err, res)=>{
                    if (err){
                        return done(err);
                    }

                    User.findById(users[0]._id).then((user)=>{
                        expect(user.tokens.length).toBe(0);
                        done();
                    }).catch((e)=>done(e));
                })

        });
    });
});