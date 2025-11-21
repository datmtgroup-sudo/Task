import React from 'react';
import { Task, TaskStatus, ReviewStatus } from '../types';

interface ReviewControlsProps {
    task: Task;
    currentUser: string;
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
    onReviewAction: (taskId: string, action: 'approve' | 'reject', comment?: string) => void;
}

export const ReviewControls: React.FC<ReviewControlsProps> = ({ task, currentUser, onStatusChange, onReviewAction }) => {
    if (!task.review_required) {
        return null;
    }

    const isAssignee = task.assignee === currentUser;
    const isApprover = task.approver === currentUser;

    const handleSubmitForReview = () => {
        onStatusChange(task.id, TaskStatus.PendingReview);
    };

    const handleApprove = () => {
        onReviewAction(task.id, 'approve');
    };

    const handleReject = () => {
        const comment = prompt("Vui lòng cho biết lý do từ chối/yêu cầu chỉnh sửa:");
        if (comment) {
            onReviewAction(task.id, 'reject', comment);
        }
    };

    // Case 1: Task is not yet submitted for review
    if (task.reviewStatus === ReviewStatus.NotSubmitted && isAssignee && task.status !== TaskStatus.Done) {
        return (
            <button
                onClick={handleSubmitForReview}
                className="w-full text-center px-3 py-1.5 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
                Submit để duyệt
            </button>
        );
    }

    // Case 2: Task is pending review and current user is the approver
    if (task.reviewStatus === ReviewStatus.Pending && isApprover && task.status === TaskStatus.PendingReview) {
        return (
            <div className="flex w-full space-x-2">
                <button
                    onClick={handleReject}
                    className="flex-1 text-center px-3 py-1.5 border border-red-300 text-sm font-semibold rounded-md shadow-sm text-red-700 bg-red-100 hover:bg-red-200"
                >
                    Từ chối
                </button>
                <button
                    onClick={handleApprove}
                    className="flex-1 text-center px-3 py-1.5 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                    Phê duyệt
                </button>
            </div>
        );
    }
    
    // Case 3: Task has been rejected and is assigned back to the user
    if (task.reviewStatus === ReviewStatus.Rejected && isAssignee && task.status === TaskStatus.Doing) {
         return (
             <div className="w-full p-2 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-md">
                <p className="text-xs text-red-700 dark:text-red-200">
                    <span className="font-bold">Bị từ chối:</span> {task.rejection_comment}
                </p>
                <button
                    onClick={handleSubmitForReview}
                    className="mt-2 w-full text-center px-3 py-1 text-xs font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    Gửi lại để duyệt
                </button>
            </div>
        );
    }

    return null; // No controls to show otherwise
};