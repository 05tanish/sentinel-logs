import { expect } from 'chai';
import sinon from 'sinon';

describe('Sender Module - Mocking Examples', () => {
  
  describe('HTTP Request Mocking', () => {
    
    it('should mock successful axios POST request', async () => {
      const fakeAxios = {
        post: sinon.stub().resolves({ 
          status: 200, 
          data: { success: true } 
        })
      };

      const result = await fakeAxios.post('/api/logs', { raw: 'test' });

      expect(result.status).to.equal(200);
      expect(result.data.success).to.be.true;
      expect(fakeAxios.post.calledOnce).to.be.true;
    });

    it('should mock network error', async () => {
      const fakeAxios = {
        post: sinon.stub().rejects(new Error('Network error'))
      };

      try {
        await fakeAxios.post('/api/logs', { raw: 'test' });
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Network error');
      }
    });

    it('should mock different responses per call', async () => {
      const fakeAxios = { get: sinon.stub() };
      
      fakeAxios.get.onFirstCall().resolves({ status: 200 });
      fakeAxios.get.onSecondCall().rejects(new Error('Timeout'));

      const result1 = await fakeAxios.get('/health');
      expect(result1.status).to.equal(200);

      try {
        await fakeAxios.get('/health');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.equal('Timeout');
      }

      expect(fakeAxios.get.calledTwice).to.be.true;
    });
  });

  describe('Spies', () => {
    it('should spy on function calls', () => {
      const myFunction = (a, b) => a + b;
      const spy = sinon.spy(myFunction);

      const result = spy(2, 3);

      expect(result).to.equal(5);
      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith(2, 3)).to.be.true;
    });
  });

  describe('Cleanup', () => {
    let stub;

    beforeEach(() => {
      stub = sinon.stub(console, 'log');
    });

    afterEach(() => {
      stub.restore();
    });

    it('should mock console.log', () => {
      console.log('test message');
      
      expect(stub.calledOnce).to.be.true;
      expect(stub.calledWith('test message')).to.be.true;
    });
  });
});
