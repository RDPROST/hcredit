import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    userId: null,
    firstname: null,
    lastname: null,
    fullname: null,
    avatar: "/assets/images/nophoto.jpg",
    org: null,
    role: null,
    signedIn: false,
    gender: null,
    access: {
        isAdmin: false,
        isMethodist: false,
        isTrainer: false,
        isCollaborator: false,
    }
}

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        SET_USER_ID: (state, action) => {
            state.userId = action.payload;
        },
        SET_USER_FIRSTNAME: (state, action) => {
            state.firstname = action.payload;
        },
        SET_USER_LASTNAME: (state, action) => {
            state.lastname = action.payload;
        },
        SET_USER_FULLNAME: (state, action) => {
            state.fullname = action.payload;
        },
        SET_USER_AVATAR: (state, action) => {
            state.avatar = action.payload;
        },
        SET_USER_ORG: (state, action) => {
            state.org = action.payload;
        },
        SET_USER_ACCESS: (state, action) => {
            state.access = action.payload;
        },
        SET_USER_ROLE: (state, action) => {
            state.role = action.payload;
        },
        SET_USER_SIGNED: (state, action) => {
            state.signedIn = action.payload;
        },
        SET_USER_GENDER: (state, action) => {
            state.gender = action.payload;
        }
    }
})

export const {SET_USER_FIRSTNAME, SET_USER_LASTNAME, SET_USER_FULLNAME, SET_USER_AVATAR, SET_USER_ORG, SET_USER_ACCESS, SET_USER_ID, SET_USER_ROLE, SET_USER_SIGNED, SET_USER_GENDER} = userSlice.actions;
export default userSlice.reducer;