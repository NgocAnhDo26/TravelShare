import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PlanService } from '../../src/services/plan.service';
import Plan from '../../src/models/plan.model';
import ItineraryItem from '../../src/models/itineraryItem.model';


jest.mock('../../src/models/plan.model');
jest.mock('../../src/models/itineraryItem.model');

const mockedPlan = Plan as jest.Mocked<typeof Plan>;
const mockedItineraryItem = ItineraryItem as jest.Mocked<typeof ItineraryItem>;

describe('PlanService', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    const mockUserId = new mongoose.Types.ObjectId().toHexString();
    const mockPlanId = new mongoose.Types.ObjectId().toHexString();
    const mockItemId = new mongoose.Types.ObjectId().toHexString();

    
    beforeEach(() => {
        jest.resetAllMocks();
        mockRequest = {
            params: {},
            body: {},
            user: mockUserId, 
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    describe('addItineraryItem', () => {
        it('should add an item to a plan successfully and return 201', async () => {
         
            mockRequest.params = { id: mockPlanId };
            mockRequest.body = {
                dayNumber: 1,
                activityName: 'Test Activity',
            };

            const mockPlan = { _id: mockPlanId, creator: mockUserId, save: jest.fn().mockResolvedValue(true) };
            (mockedPlan.findById as jest.Mock).mockResolvedValue(mockPlan);
            
            (mockedItineraryItem.findOne as jest.Mock).mockReturnValue({
                sort: jest.fn().mockResolvedValue(null),
            });

            const mockSave = jest.fn().mockResolvedValue(true);
            (mockedItineraryItem as unknown as jest.Mock).mockImplementation(() => ({ save: mockSave }));

            await PlanService.addItineraryItem(mockRequest as Request, mockResponse as Response);

            expect(mockedPlan.findById).toHaveBeenCalledWith(mockPlanId);
            expect(mockSave).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.any(String),
                    data: expect.any(Object),
                }),
            );
        });

        it('should return 403 if user is not the plan creator', async () => {
            mockRequest.params = { id: mockPlanId };
            mockRequest.body = { dayNumber: 1, activityName: 'Valid Activity' };
            const anotherUserId = new mongoose.Types.ObjectId().toHexString();
            const mockPlan = { _id: mockPlanId, creator: anotherUserId };
            (mockedPlan.findById as jest.Mock).mockResolvedValue(mockPlan);

            await PlanService.addItineraryItem(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'You are not authorized to modify this plan.' });
        });

        it('should return 404 if plan is not found', async () => {
            mockRequest.params = { id: mockPlanId };
            mockRequest.body = { dayNumber: 1, activityName: 'Valid Activity' };
            (mockedPlan.findById as jest.Mock).mockResolvedValue(null);

            await PlanService.addItineraryItem(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Plan not found.' });
        });

        it('should return 400 for invalid Plan ID format', async () => {
            mockRequest.params = { id: 'invalid-id' };

            await PlanService.addItineraryItem(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: "Invalid Plan ID format." });
        });
    });

 
    describe('getItineraryItemById', () => {
        it('should get an item successfully and return 200', async () => {
         
            mockRequest.params = { id: mockPlanId, itemId: mockItemId };
            const mockItem = { _id: mockItemId, plan_id: mockPlanId, activityName: 'Found Item' };
            const mockPlan = { _id: mockPlanId, creator: mockUserId };
            
            (mockedItineraryItem.findById as jest.Mock).mockResolvedValue(mockItem);
            (mockedPlan.findById as jest.Mock).mockResolvedValue(mockPlan);
            
          
            await PlanService.getItineraryItemById(mockRequest as Request, mockResponse as Response);
            
        
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockItem);
        });
        
        it('should return 404 if item is not found', async () => {
         
            mockRequest.params = { id: mockPlanId, itemId: mockItemId };
            (mockedItineraryItem.findById as jest.Mock).mockResolvedValue(null);
            (mockedPlan.findById as jest.Mock).mockResolvedValue({ _id: mockPlanId, creator: mockUserId });

            await PlanService.getItineraryItemById(mockRequest as Request, mockResponse as Response);
            
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Itinerary item not found in this plan.' });
        });
    });

    describe('updateItineraryItem', () => {
        it('should update an item successfully and return 200', async () => {
            mockRequest.params = { id: mockPlanId, itemId: mockItemId };
            mockRequest.body = { notes: 'Updated notes' };

            const mockItem = { 
                _id: mockItemId, 
                plan_id: mockPlanId, 
                notes: 'Old notes',
                save: jest.fn().mockImplementation(function(this: any) { return Promise.resolve(this); })
            };
            Object.assign(mockItem, mockRequest.body);

            const mockPlan = { _id: mockPlanId, creator: mockUserId, save: jest.fn().mockResolvedValue(true) };

            (mockedPlan.findById as jest.Mock).mockResolvedValue(mockPlan);
            (mockedItineraryItem.findOne as jest.Mock).mockResolvedValue(mockItem);

            await PlanService.updateItineraryItem(mockRequest as Request, mockResponse as Response);

            expect(mockItem.save).toHaveBeenCalled();
            expect(mockPlan.save).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ notes: 'Updated notes' })
            }));
        });
    });

    describe('deleteItineraryItem', () => {
        it('should delete an item successfully and return 200', async () => {

            mockRequest.params = { id: mockPlanId, itemId: mockItemId };
            const mockPlan = { _id: mockPlanId, creator: mockUserId };

            (mockedPlan.findById as jest.Mock).mockResolvedValue(mockPlan);
            (mockedItineraryItem.findOneAndDelete as jest.Mock).mockResolvedValue({ _id: mockItemId });

            await PlanService.deleteItineraryItem(mockRequest as Request, mockResponse as Response);

            expect(mockedItineraryItem.findOneAndDelete).toHaveBeenCalledWith({
                _id: mockItemId,
                plan_id: mockPlanId,
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Item deleted successfully!' });
        });
        
        it('should return 404 if item to delete is not found', async () => {
            mockRequest.params = { id: mockPlanId, itemId: mockItemId };
            const mockPlan = { _id: mockPlanId, creator: mockUserId };

            (mockedPlan.findById as jest.Mock).mockResolvedValue(mockPlan);
            (mockedItineraryItem.findOneAndDelete as jest.Mock).mockResolvedValue(null);

            await PlanService.deleteItineraryItem(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Itinerary item not found in this plan.' });
        });
    });
});
