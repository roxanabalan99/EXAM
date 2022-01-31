const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const app = express();
const {
    Op
} = require('sequelize')
//for filtering minDate

app.use(bodyParser.json())

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'sample.db',
    define: {
        timestamps: false
    }
})


//Defining the first entity
const FavoriteList = sequelize.define('list', {
    description: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            len: [3, 45]
        }
    },
    date: {
        type: Sequelize.DATE,
        allowNull: false
    }
})

//Defining the second entity
const Video = sequelize.define('video', {
    description: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            len: [5, 45]
        }
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            len: [5, 45]
        }
    },
    url: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            isUrl: true
        }
    }
})

//Defining the relationship between the entities
FavoriteList.hasMany(Video)



//creating tables
app.get('/sync', async (req, res) => {
    try {
        await sequelize.sync({
            force: true
        });
        res.status(201).json({
            message: 'tables created'
        })
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }
})

//get all lists
app.get('/lists', async (req, res) => {
    const {
        minDate
    } = req.query
    const {
        sortBy
    } = req.query
    const {
        minDescrLen
    } = req.query
    try {

        const lists = await FavoriteList.findAll({

            //filter
            where: minDate ? {
                date: {
                    [Op.gt]: minDate
                }
            } : undefined,

            //order
            order: sortBy ? [
                [sortBy, 'ASC']
            ] : undefined
        });
        res.status(200).json(lists)
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }
})


//Get operation for the first entity
app.get('/lists/:lid', async (req, res) => {
    try {

        const list = await FavoriteList.findByPk(req.params.lid, {
            include: Video
        })
        if (list) {
            res.status(200).json(list)
        } else {
            res.status(404).json({
                message: 'list not found'
            })
        }
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }
})

//Post - 1st entity
app.post('/lists', async (req, res) => {
    try {
        const list = req.body
        await FavoriteList.create(list)
        res.status(201).json({
            message: 'list created'
        })
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }
})

//Put - 1st entity
app.put('/lists/:lid', async (req, res) => {
    try {
        const list = await FavoriteList.findByPk(req.params.lid)
        if (list) {
            await list.update(req.body, {
                fields: ['description', 'date']
            })
            res.status(200).json({
                message: 'list updated'
            })
        } else {
            console.warn(err);
            res.status(404).json({
                message: 'list not found'
            })
        }
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }
})

//Delete - 1st entity
app.delete('/lists/:lid', async (req, res) => {
    try {
        const list = await FavoriteList.findByPk(req.params.lid)
        if (list) {
            await list.destroy()
            res.status(200).json({
                message: 'list deleted'
            })
        } else {
            res.status(404).json({
                message: 'list not found'
            })
        }
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }

})

//Get - 2nd entity
//get a specific list's videos
app.get('/lists/:lid/videos', async (req, res) => {
    try {
        const list = await FavoriteList.findByPk(req.params.lid, {
            include: Video
        })
        if (list) {
            const videos = await list.getVideos()
            res.status(200).json(videos)
        } else {
            res.status(404).json({
                message: 'list not found'
            })
        }
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }
})

//get a specific video
app.get('/lists/:lid/videos/:vid', async (req, res) => {
    try {
        const list = await FavoriteList.findByPk(req.params.lid)
        if (list) {
            const videos = await list.getVideos({
                where: {
                    id: req.params.vid
                }
            })
            res.status(200).json(videos.shift())
        } else {
            res.status(404).json({
                message: 'not found'
            })
        }
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }
})

//Post - 2nd entity
//add a video to a specific list
app.post('/lists/:lid/videos', async (req, res) => {
    try {
        const list = await FavoriteList.findByPk(req.params.lid)
        if (list) {
            const video = req.body
            video.listId = list.id
            await Video.create(video)
            res.status(200).json({
                message: 'video created'
            })
        } else {
            res.status(404).json({
                message: 'list not found'
            })
        }
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }
})


//Put - 2nd entity
//edit a video  from a specific list
app.put('/lists/:lid/videos/:vid', async (req, res) => {
    try {
        const list = await FavoriteList.findByPk(req.params.lid)
        if (list) {
            const videos = await list.getVideos({
                where: {
                    id: req.params.vid
                }
            })
            const video = videos.shift()
            if (videos) {
                await video.update(req.body)
                res.status(201).json({
                    message: 'video modified'
                })
            } else {
                res.status(404).json({
                    message: 'video not found'
                })
            }
        } else {
            res.status(404).json({
                message: 'list not found'
            })
        }
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }
})


//Delete - 2nd entity
//delete a video from a specific list
app.delete('/lists/:lid/videos/:vid', async (req, res) => {
    try {
        const list = await FavoriteList.findByPk(req.params.lid)
        if (list) {
            const videos = await list.getVideos({
                where: {
                    id: req.params.vid
                }
            })
            const video = videos.shift()
            if (video) {
                await video.destroy()
                res.status(202).json({
                    message: 'video deleted'
                })
            } else {
                res.status(404).json({
                    message: 'video not found'
                })
            }
        } else {
            res.status(404).json({
                message: 'list not found'
            })
        }
    } catch (err) {
        console.warn(err);
        res.status(500).json({
            message: 'some error occured'
        })
    }

})


//Filtering 2 fields 1st entity


//import


//Export


app.listen(8080)