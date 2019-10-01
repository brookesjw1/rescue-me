const chai = require('chai');
const axios = require('axios');
const { expect } = chai;

describe('getDogs', () => {
    let unfilteredLength;
    it('returns a list of dogs', () => {
        return axios.get("https://us-central1-rescuemetest-4a629.cloudfunctions.net/getDogs")
        .then((res) => {
            unfilteredLength = res.data.dogs.length;
            expect(res.status).to.equal(200);
            expect(res.data.dogs).to.be.an('array');
        });
    });
    it('filters out any dogs outside the specified radius', () => {
        return axios.get("https://us-central1-rescuemetest-4a629.cloudfunctions.net/getDogs?radius=50&lat=53.4808&lon=-2.2426")
        .then((res) => {
            expect(res.status).to.equal(200);
            expect(res.data.dogs.length).to.be.lessThan(unfilteredLength);
        });
    });
    it('filters out any dogs not suitable for children', () => {
        return axios.get("https://us-central1-rescuemetest-4a629.cloudfunctions.net/getDogs?children=true")
        .then((res) => {
            expect(res.status).to.equal(200);
            expect(res.data.dogs.length).to.be.lessThan(unfilteredLength);
        });
    });
    it('filters out any dogs not suitable for homes with other dogs', () => {
        return axios.get("https://us-central1-rescuemetest-4a629.cloudfunctions.net/getDogs?dogs=true")
        .then((res) => {
            expect(res.status).to.equal(200);
            expect(res.data.dogs.length).to.be.lessThan(unfilteredLength);
        });
    });
    it('filters out any dogs above the users activity level', () => {
        return axios.get("https://us-central1-rescuemetest-4a629.cloudfunctions.net/getDogs?activity=3")
        .then((res) => {
            expect(res.status).to.equal(200);
            expect(res.data.dogs.length).to.be.lessThan(unfilteredLength);
        });
    });
    it('returns an array containing the correct four keys', () => {
        return axios.get("https://us-central1-rescuemetest-4a629.cloudfunctions.net/getDogs")
        .then(res => {
            for (let i = 0; i < res.data.dogs.length; i++) {
                expect(res.data.dogs[i]).to.have.all.keys("name", "dob", "id", "photos");
            }
        })
    });
});