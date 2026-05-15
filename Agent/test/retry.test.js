import { expect } from 'chai';
import { chunkArray, sleep } from '../src/retry.js';

describe('Retry Module', () => {
  
  describe('chunkArray()', () => {
    it('should split array into chunks of specified size', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = chunkArray(array, 3);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(4);
      expect(result[0]).to.deep.equal([1, 2, 3]);
      expect(result[1]).to.deep.equal([4, 5, 6]);
      expect(result[2]).to.deep.equal([7, 8, 9]);
      expect(result[3]).to.deep.equal([10]);
    });

    it('should handle empty array', () => {
      const result = chunkArray([], 3);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });

    it('should handle chunk size larger than array', () => {
      const result = chunkArray([1, 2], 10);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.deep.equal([1, 2]);
    });
  });

  describe('sleep()', () => {
    it('should delay execution for specified milliseconds', async () => {
      const startTime = Date.now();
      await sleep(100);
      const endTime = Date.now();
      
      const elapsed = endTime - startTime;
      expect(elapsed).to.be.at.least(90);
      expect(elapsed).to.be.at.most(150);
    });
  });
});
