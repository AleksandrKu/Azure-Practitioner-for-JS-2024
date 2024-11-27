// First, set up environment variables
process.env.COSMOS_ENDPOINT = 'https://mock-cosmos.documents.azure.com:443/';
process.env.COSMOS_KEY = 'mock-key';

// Create mock objects
const mockUpsert = jest.fn().mockResolvedValue({ resource: {} });
const mockItems = { upsert: mockUpsert };
const mockContainer = { items: mockItems };
const mockDatabase = { container: jest.fn().mockReturnValue(mockContainer) };
const mockCosmosClient = { database: jest.fn().mockReturnValue(mockDatabase) };

// Mock Azure Functions
jest.mock('@azure/functions', () => ({
  app: {
    serviceBusQueue: jest.fn()
  },
  InvocationContext: jest.fn()
}));

// Import Azure Functions types
import { InvocationContext } from "@azure/functions";

// Mock Azure Functions context
const mockContext: InvocationContext = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  invocationId: 'test-id',
  functionName: 'serviceBusQueueTrigger',
  extraInputs: {
    get: jest.fn(),
    set: jest.fn()
  },
  extraOutputs: {
    get: jest.fn(),
    set: jest.fn()
  },
  options: {
    trigger: {
      type: 'serviceBusTrigger',
      name: 'message',
      direction: 'in'
    },
    extraInputs: [],
    extraOutputs: []
  },
  retryContext: {
    retryCount: 0,
    maxRetryCount: 0,
    exception: null
  },
  triggerMetadata: {
    enqueuedTimeUtc: '2021-01-01T00:00:00Z',
    deliveryCount: 1,
    messageId: 'test-message-id'
  }
};

describe('serviceBusQueueTrigger', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockUpsert.mockReset().mockResolvedValue({ resource: {} });
    mockDatabase.container.mockReset().mockReturnValue(mockContainer);
    mockCosmosClient.database.mockReset().mockReturnValue(mockDatabase);
  });

  it('should process a valid product message and upsert to Cosmos DB', async () => {
    // Mock Cosmos DB within the test
    jest.mock('@azure/cosmos', () => ({
      CosmosClient: jest.fn().mockImplementation(() => mockCosmosClient)
    }));

    // Import the function after mocking
    const { serviceBusQueueTrigger } = require('../../functions/service-bus-import-product');

    const mockMessage = {
      id: 'test-id',
      title: 'Test Product',
      description: 'A product used for testing',
      price: 99.99,
      count: 10
    };

    await serviceBusQueueTrigger(mockMessage, mockContext);

    // Verify logging
    expect(mockContext.log).toHaveBeenCalledWith('ServiceBus queue trigger function received a message');
    expect(mockContext.log).toHaveBeenCalledWith('Service bus queue function processed message:', mockMessage);
    expect(mockContext.log).toHaveBeenCalledWith(mockMessage.id);
    
    // Get the CosmosClient constructor mock
    const { CosmosClient } = require('@azure/cosmos');
    
    // Verify CosmosDB client initialization
    expect(CosmosClient).toHaveBeenCalledWith({
      endpoint: process.env.COSMOS_ENDPOINT,
      key: process.env.COSMOS_KEY
    });
    
    // Verify database initialization
    expect(mockCosmosClient.database).toHaveBeenCalledWith('products-db');
    
    // Verify container calls
    expect(mockDatabase.container).toHaveBeenCalledWith('products');
    expect(mockDatabase.container).toHaveBeenCalledWith('stocks');
    
    // Verify upsert calls
    expect(mockUpsert).toHaveBeenCalledWith(mockMessage); // For products
    expect(mockUpsert).toHaveBeenCalledWith({
      product_id: mockMessage.id,
      count: mockMessage.count
    }); // For stocks
  });

  it('should handle errors thrown during processing', async () => {
    // Mock Cosmos DB within the test
    jest.mock('@azure/cosmos', () => ({
      CosmosClient: jest.fn().mockImplementation(() => mockCosmosClient)
    }));

    // Import the function after mocking
    const { serviceBusQueueTrigger } = require('../../functions/service-bus-import-product');

    const mockMessage = {
      id: 'test-id',
      title: 'Test Product',
      description: 'A product used for testing',
      price: 99.99,
      count: 10
    };

    // Mock an error for this test
    mockUpsert.mockRejectedValueOnce(new Error('Failed to upsert item'));

    await serviceBusQueueTrigger(mockMessage, mockContext);

    expect(mockContext.error).toHaveBeenCalledWith(
      'Error populating to DB:',
      expect.any(Error)
    );
  });

  it('should handle invalid message format', async () => {
    // Mock Cosmos DB within the test
    jest.mock('@azure/cosmos', () => ({
      CosmosClient: jest.fn().mockImplementation(() => mockCosmosClient)
    }));

    // Import the function after mocking
    const { serviceBusQueueTrigger } = require('../../functions/service-bus-import-product');

    const invalidMessage = {};

    // Mock an error for invalid message
    mockUpsert.mockRejectedValueOnce(new Error('Invalid message format'));

    await serviceBusQueueTrigger(invalidMessage, mockContext);

    expect(mockContext.error).toHaveBeenCalled();
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.COSMOS_ENDPOINT;
    delete process.env.COSMOS_KEY;
  });
}); 