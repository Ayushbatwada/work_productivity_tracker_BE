const taskModel = require('./model');
const responseData = require('../../utils/responseData');
const sanityChecks  = require('../../utils/sanityChecks');
const taskConfig = require('./config.json');

module.exports = {
    createTask: (req, callback) => {
        let response;
        const body = req.body;
        const taskName = body.taskName;
        const taskDescription = body.taskDescription;
        const taskType = body.taskType;
        const tags = body.tags || [];
        const createdBy = body.createdBy;

        if (!taskName || !createdBy || (createdBy && !createdBy.userId) || !taskType || (taskType === 'other' && !sanityChecks.isValidArray(tags))) {
            console.log('ERROR ::: Missing info in createTask service with info, taskName: ' + taskName +
                '. createdBy: ' + createdBy + '. taskDescription: ' + taskDescription + '. taskType: ' + taskType +
                '. tags: ' + tags);
            response = new responseData.payloadError();
            return callback(null, response);
        }

        try {
            const task = new taskModel();
            task.taskName = taskName;
            task.taskDescription = taskDescription;
            task.taskType = taskType;
            task.createdBy = createdBy;
            task.updateddBy = createdBy;
            task.tags = tags;

            task.save().then((dbResp) => {
                response = new responseData.successMessage();
                response.data = dbResp;
                callback(null, response);
            }).catch((err) => {
                console.log('ERROR ::: found in db error catch block of createTask service with err: ' + err);
                response = new responseData.serverError();
                callback(null, response);
            })
        } catch(err) {
            console.log('ERROR ::: found in catch block of createTask service with err: ' + err);
            response = new responseData.serverError();
            callback(null, response);
        }
    },

    getAllTasks: (req, callback) => {
        let response;
        const userId = req.query.uid;
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const status = req.query.status;

        if (!sanityChecks.isValidString(userId)) {
            console.log('ERROR ::: Missing info in getAllTasks service with info, userId: ' + userId);
            response = new responseData.payloadError();
            return callback(null, response);
        }

        try {
            const options = {
                page: page,
                limit: limit,
                customLabels: responseData.customLabels
            };
            const filterQuery = {
                "createdBy.userId" : userId
            }
            if (sanityChecks.isValidString(status)){
                filterQuery.status = { $ne: 'inactive' };
            } else {
                filterQuery.status = { $ne: 'inactive' };
            }
            taskModel.paginate(filterQuery, options, (err, dbResp) => {
                if (err) {
                    console.log('ERROR ::: found in getAllTasks service with err: ' + err);
                    response = new responseData.serverError();
                    callback(null, response);
                } else {
                    response = new responseData.successMessage();
                    response.data = dbResp.data;
                    response.total = dbResp.total;
                    response.pages = dbResp.pages;
                    response.page = dbResp.page;
                    response.limit = dbResp.limit;
                    callback(null, response);
                }
            })
        } catch(err) {
            console.log('ERROR ::: found in catch block of getAllTasks service with err: ' + err);
            response = new responseData.serverError();
            callback(null, response);
        }
    },

    editTask: (req, callback) => {

    },

    changeTaskStatus: (req, callback) => {
        let response;
        const body = req.body;
        const taskId = body.taskId;
        const createdBy = body.createdBy;

        if (!taskId || !createdBy || (createdBy && !createdBy.userId)) {
            console.log('ERROR ::: Missing info in changeTaskStatus service with info, taskId: ' + taskId +
                '. createdBy: ' + createdBy);
            response = new responseData.payloadError();
            return callback(null, response);
        }

        try {
            const filterQuery = {
                _id: taskId,
                status: { $ne: 'inactive' }
            }
            const updateQuery = {
                status: 'inactive'
            }
            taskModel.findOneAndUpdate(filterQuery, updateQuery, (err, dbResp) => {
                if (err) {
                    console.log('ERROR ::: found in changeTaskStatus service with err: ' + err);
                    response = new responseData.serverError();
                    callback(null, response);
                } else if (dbResp && dbResp._id) {
                    response = new responseData.successMessage();
                    response.data = dbResp;
                    callback(null, response);
                } else {
                    response = new responseData.notFoundError();
                    callback(null, response);
                }
            })
        } catch(err) {
            console.log('ERROR ::: found in catch block of changeTaskStatus service with err: ' + err);
            response = new responseData.serverError();
            callback(null, response);
        }
    },

    getFolderAssociatedTasks: (req, callback) => {
        let response;
        const userId = req.query.uid;
        const folderId = req.query.fid;
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;

        if (!sanityChecks.isValidMongooseId(userId) || !sanityChecks.isValidMongooseId(folderId)) {
            console.log('ERROR ::: Missing info in "getFolderAssociatedTasks" service with info, userId: ' + userId
                + '. folderId: ' + folderId);
            response = new responseData.payloadError();
            return callback(null, response);
        }

        try {
            const options = {
                page: page,
                limit: limit,
                customLabels: responseData.customLabels
            };
            const filterQuery = {
                folderId: folderId,
                status: taskConfig.status.active,
                "createdBy.userId": userId,
            }
            taskModel.paginate(filterQuery, options, (err, dbResp) => {
                if (err) {
                    console.log('ERROR ::: found in :getFolderAssociatedTasks: service error block with err: ' + err);
                    response = new responseData.serverError();
                    callback(null, response);
                } else {
                    response = new responseData.successMessage();
                    response = {...response, ...dbResp};
                    callback(null, response);
                }
            });
        } catch (err) {
            console.log('ERROR ::: found in "getFolderAssociatedTasks" service catch block with err: ' + err);
            response = new responseData.serverError();
            callback(null, response);
        }
    },

    addTaskInFolder: (body, callback) => {
        let response;
        const folderId = body.folderId;
        const taskId = body.taskId;
        const createdBy = body.createdBy;

        if (!sanityChecks.isValidMongooseId(folderId) || !sanityChecks.isValidMongooseId(taskId) || !createdBy ||
            !sanityChecks.isValidMongooseId(createdBy.userId)) {
            console.log('ERROR ::: Missing info in "addTaskInFolder" service with info, err: ' + folderId +
                '. createdBy: ' + JSON.stringify(createdBy) + '. taskId: ' + taskId);
            response = new responseData.payloadError();
            return callback(null, response);
        }

        try {
            const filterQuery = {
                _id: taskId,
                status: taskConfig.status.active
            }
            const updateQuery = {
                folderId: folderId
            }
            taskModel.findOneAndUpdate(filterQuery, updateQuery, (err, dbResp) => {
                if (err) {
                    console.log('ERROR ::: found in "addTaskInFolder" service error block with err: ' + err);
                    response = new responseData.serverError();
                    callback(null, response);
                } else if (sanityChecks.isValidObject(dbResp)) {
                    response = new responseData.successMessage();
                    callback(null, response);
                } else {
                    response = new responseData.notFoundError();
                    callback(null, response);
                }
            })
        } catch (err) {
            console.log('ERROR ::: found in "addTaskInFolder" service catch block with err: ' + err);
            response = new responseData.serverError();
            callback(null, response);
        }
    },

    removeTaskFromFolder: (body, callback) => {
        let response;
        const folderId = body.folderId;
        const taskId = body.taskId;
        const createdBy = body.createdBy;

        if (!sanityChecks.isValidMongooseId(folderId) || !createdBy || !sanityChecks.isValidMongooseId(createdBy.userId)) {
            console.log('ERROR ::: Missing info in "removeTaskFromFolder" service with info, err: ' + folderId +
                '. createdBy: ' + createdBy + '. taskId: ' + taskId);
            response = new responseData.payloadError();
            return callback(null, response);
        }

        try {
            const filterQuery = {
                _id: taskId,
                folderId: folderId
            };
            const updateQuery = {
                folderId: null
            };
            taskModel.findOneAndUpdate(filterQuery, updateQuery, (err, dbResp) => {
                if (err) {
                    console.log('ERROR ::: found in "removeTaskFromFolder" service error block with err: ' + err);
                    response = new responseData.serverError();
                    callback(null, response);
                } else if (sanityChecks.isValidObject(dbResp)) {
                    response = new responseData.successMessage();
                    callback(null, response);
                } else {
                    response = new responseData.notFoundError();
                    callback(null, response);
                }
            })
        } catch (err) {
            console.log('ERROR ::: found in "removeTaskFromFolder" service catch block with err: ' + err);
            response = new responseData.serverError();
            callback(null, response);
        }
    }
}
