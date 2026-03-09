/**
 * Builds the FOCCACIA Web Site controller (server-side rendered HTML via Handlebars).
 *
 * This module returns a set of Express route handlers that use the provided services
 * to fetch domain data and render views.
 *
 * @param {object} groupsServices Service used to manage groups (CRUD + players).
 * @param {object} competitionsServices Service used to fetch competitions/teams data.
 * @param {string} footballDataApiKey API key used by the competitions service.
 * @returns {{
 *   getHome: (req: import('express').Request, res: import('express').Response) => void,
 *   getGroups: (req: import('express').Request, res: import('express').Response) => Promise<void>,
 *   getGroupDetails: (req: import('express').Request, res: import('express').Response) => Promise<void>,
 *   getCreateGroupForm: (req: import('express').Request, res: import('express').Response) => void,
 *   createGroup: (req: import('express').Request, res: import('express').Response) => Promise<void>,
 *   getUpdateGroupForm: (req: import('express').Request, res: import('express').Response) => Promise<void>,
 *   updateGroup: (req: import('express').Request, res: import('express').Response) => Promise<void>,
 *   deleteGroup: (req: import('express').Request, res: import('express').Response) => Promise<void>,
 *   addPlayer: (req: import('express').Request, res: import('express').Response) => Promise<void>,
 *   removePlayer: (req: import('express').Request, res: import('express').Response) => Promise<void>
 * }}
 */
export default function init(groupsServices, competitionsServices, footballDataApiKey) {
    if (!groupsServices) throw new Error('groupsServices required');
    if (!competitionsServices) throw new Error('competitionsServices required');

    return {
        getHome,
        getGroups,
        getGroupDetails,
        getCreateGroupForm,
        createGroup,
        getUpdateGroupForm, 
        updateGroup,        
        deleteGroup,        
        addPlayer,          
        removePlayer        
    };

    /**
     * Extracts the current user token from the request (when authenticated).
     *
     * @param {import('express').Request} req Express request.
     * @returns {string|null} The user token or null when unauthenticated.
     */
    function getToken(req) {
        return req.user ? req.user.token : null;
    }

    /**
     * Renders the home page.
     *
     * @param {import('express').Request} req Express request.
     * @param {import('express').Response} res Express response.
     * @returns {void}
     */
    function getHome(req, res) {
        res.render('home', {
            title: 'FOCCACIA - Football Squads Manager'
        });
    }

    /**
     * Lists all groups and renders the groups list page.
     *
     * @param {import('express').Request} req Express request.
     * @param {import('express').Response} res Express response.
     * @returns {Promise<void>}
     */
    async function getGroups(req, res) {
        try {
            const token = getToken(req);
            const result = await groupsServices.getAll(token);

            if (result && (result.error || result.internalError || result.status)) {
                return res.render('error', {
                    message: result.description || result.error || 'Erro ao carregar os grupos.'
                });
            }

            res.render('groups/list', { groups: result });
        } catch (err) {
            console.error('[WEB] getGroups failed:', err);
            res.status(500).render('error', {
                message: 'Internal server error while loading groups.',
                error: err?.message
            });
        }
    }

    /**
     * Loads a group by id and renders the group details page.
     * Also loads teams/players (when competition+year are set) for the add-player dropdown.
     *
     * @param {import('express').Request} req Express request.
     * @param {import('express').Response} res Express response.
     * @returns {Promise<void>}
     */
    async function getGroupDetails(req, res) {
        try {
            const token = getToken(req);
            const groupId = req.params.groupId;
            const group = await groupsServices.getById(groupId, token);

            if (group.internalError) {
                return res.status(404).render('error', {
                    message: 'Group not found'
                });
            }

            let teams = [];
            if (group.competition && group.year) {
                const compData = await competitionsServices.getTeamsAndPlayers(group.competition, group.year, footballDataApiKey);
                if (compData && compData.teams) {
                    teams = compData.teams;
                }
            }

            res.render('groups/details', {
                title: `${group.name} - Squad Details`,
                group,
                teams
            });
        } catch (error) {
            console.error('[WEB] getGroupDetails failed:', error);
            res.status(500).render('error', {
                message: 'Error loading group.',
                error: error?.message
            });
        }
    }

    /**
     * Renders the create group form.
     *
     * @param {import('express').Request} req Express request.
     * @param {import('express').Response} res Express response.
     * @returns {void}
     */
    function getCreateGroupForm(req, res) {
        res.render('groups/create', {
            title: 'Create New Group'
        });
    }

    /**
     * Creates a new group and redirects to its details page.
     *
     * @param {import('express').Request} req Express request.
     * @param {import('express').Response} res Express response.
     * @returns {Promise<void>}
     */
    async function createGroup(req, res) {
        try {
            const token = getToken(req);
            const body = {
                ...req.body,
                year: req.body?.year !== undefined && req.body?.year !== null && req.body?.year !== ''
                    ? Number(req.body.year)
                    : req.body?.year
            };
            const result = await groupsServices.create(body, token);

            if (result.internalError) {
                return res.status(400).render('groups/create', {
                    title: 'Create New Group',
                    error: result.description,
                    formData: body
                });
            }

            res.redirect(`/site/groups/${result.id}`);
        } catch (error) {
            console.error('[WEB] createGroup failed:', error);
            res.status(500).render('error', {
                message: 'Error creating group.',
                error: error?.message
            });
        }
    }

    /**
     * Loads group data and renders the update group form.
     *
     * @param {import('express').Request} req Express request.
     * @param {import('express').Response} res Express response.
     * @returns {Promise<void>}
     */
    async function getUpdateGroupForm(req, res) {
        try {
            const token = getToken(req);
            const groupId = req.params.groupId;
            const group = await groupsServices.getById(groupId, token);

            if (group.internalError) {
                return res.status(404).render('error', { message: 'Group not found' });
            }

            res.render('groups/update', {
                title: `Edit ${group.name}`,
                formData: group,
                group 
            });
        } catch (error) {
            console.error('[WEB] getUpdateGroupForm failed:', error);
            res.status(500).render('error', { message: 'Error loading form.', error: error?.message });
        }
    }

    /**
     * Updates an existing group and redirects back to the details page.
     *
     * @param {import('express').Request} req Express request.
     * @param {import('express').Response} res Express response.
     * @returns {Promise<void>}
     */
    async function updateGroup(req, res) {
        try {
            const token = getToken(req);
            const groupId = req.params.groupId;
            const body = {
                ...req.body,
                year: req.body?.year !== undefined && req.body?.year !== null && req.body?.year !== ''
                    ? Number(req.body.year)
                    : req.body?.year
            };
            const result = await groupsServices.update(groupId, body, token);

            if (result.internalError) {
                return res.status(400).render('groups/update', {
                    title: 'Edit Group',
                    error: result.description,
                    formData: { ...body, id: groupId }
                });
            }

            res.redirect(`/site/groups/${groupId}`);
        } catch (error) {
            console.error('[WEB] updateGroup failed:', error);
            res.status(500).render('error', { message: 'Error updating group.', error: error?.message });
        }
    }

    /**
     * Deletes a group and redirects to the groups list.
     *
     * @param {import('express').Request} req Express request.
     * @param {import('express').Response} res Express response.
     * @returns {Promise<void>}
     */
    async function deleteGroup(req, res) {
        try {
            const token = getToken(req);
            const groupId = req.params.groupId;
            const result = await groupsServices.remove(groupId, token);

            if (result.internalError) {
                return res.status(500).render('error', { message: 'Error deleting group', error: result });
            }

            res.redirect('/site/groups');
        } catch (error) {
            console.error('[WEB] deleteGroup failed:', error);
            res.status(500).render('error', { message: 'Error deleting group.', error: error?.message });
        }
    }

    /**
     * Adds a player to the given group. On validation/business errors, re-renders the details page.
     *
     * @param {import('express').Request} req Express request.
     * @param {import('express').Response} res Express response.
     * @returns {Promise<void>}
     */
    async function addPlayer(req, res) {
        try {
            const token = getToken(req);
            const groupId = req.params.groupId;
            const apiKey = footballDataApiKey;
            
            const result = await groupsServices.addPlayer(groupId, req.body, token, apiKey);

            if (result.internalError) {
                const group = await groupsServices.getById(groupId, token);
                
                let teams = [];
                if (group.competition && group.year) {
                    const compData = await competitionsServices.getTeamsAndPlayers(group.competition, group.year, apiKey);
                    if (compData && compData.teams) {
                        teams = compData.teams;
                    }
                }

                return res.render('groups/details', {
                    title: `${group.name} - Squad Details`,
                    group,
                    teams,
                    error: result.description || "Could not add player"
                });
            }

            res.redirect(`/site/groups/${groupId}`);
        } catch (error) {
            console.error('[WEB] addPlayer failed:', error);
            res.status(500).render('error', { message: 'Error adding player.', error: error?.message });
        }
    }

    /**
     * Removes a player from the given group and redirects back to the details page.
     *
     * @param {import('express').Request} req Express request.
     * @param {import('express').Response} res Express response.
     * @returns {Promise<void>}
     */
    async function removePlayer(req, res) {
        try {
            const token = getToken(req);
            const groupId = req.params.groupId;
            const playerId = req.params.playerId;

            const result = await groupsServices.removePlayer(groupId, playerId, token);

            if (result.internalError) {
                return res.render('error', { message: "Error removing player", error: result});
            }

            res.redirect(`/site/groups/${groupId}`);
        } catch (error) {
            console.error('[WEB] removePlayer failed:', error);
            res.status(500).render('error', { message: 'Error removing player.', error: error?.message });
        }
    }
}
