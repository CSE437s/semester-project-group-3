import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, TouchableOpacity, SafeAreaView, TextInput, FlatList } from "react-native";
import { Text, View, RefreshControl } from "@gluestack-ui/themed";

import axios from "axios";
import { BACKEND_URL } from "@env";
import { formatDistanceToNow, set } from "date-fns";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const COMMENT_PAGE_LENGTH = 4;


const WorkoutBlock = ({ 
    navigation, 
    item, 
    currentUserId, 
    handleWorkoutPress, 
    fromProfilePage,
    openCommentBlock, 
    setOpenCommentBlock  
}) => {
    const [liked, setLiked] = useState(item.likes.some(like => parseInt(like.userId) === parseInt(currentUserId)));
    const [likeCount, setLikeCount] = useState(item.likes.length);
    const workoutId = parseInt(item.id);

    const [commentsOpen, setCommentsOpen] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [commentCount, setCommentCount] = useState(item.comments?.length ?? 0);

    // pagination
    const [comments, setComments] = useState(item.comments ?? []);
    const [visibleComments, setVisibleComments] = useState(item.comments?.slice(0, COMMENT_PAGE_LENGTH) ?? []);
    const [currentPage, setCurrentPage] = useState(0);

    const postComment = async () => {
        if (newComment === "") {
            return;
        }
        try {
            const response = await axios.post(`${BACKEND_URL}/workouts/${workoutId}/comment`, {
                userId: parseInt(currentUserId),
                text: newComment,
            });
            setNewComment("");
            setCommentCount(commentCount + 1);

            // add the comment to the visible comments and all comments
            const newlyCreatedComment = response.data;
            console.log("bm - newlyCreatedWorkoutComment: ", newlyCreatedComment)
            setVisibleComments([newlyCreatedComment, ...visibleComments.slice(0, COMMENT_PAGE_LENGTH - 1)]);
            setComments([...comments, newlyCreatedComment]);
        } catch (error) {
            console.log("error occurred while attempting to post comment: ", error);
        }
    }

    const deleteComment = async (commentId) => {
        try {
            const response = await axios.delete(`${BACKEND_URL}/workouts/comment/${commentId}`);

            // remove the comment from the visible comments and all comments
            // use the current page index to determine which comments to show
            const startIndex = currentPage * COMMENT_PAGE_LENGTH;
            const endIndex = startIndex + COMMENT_PAGE_LENGTH;
            const filteredComments = item.comments.filter(comment => comment.id !== commentId);
            const remainingComments = filteredComments.slice(startIndex, endIndex);
            setVisibleComments(remainingComments);

            // setVisibleComments(visibleComments.filter(comment => comment.id !== commentId));
            setComments(item.comments.filter(comment => comment.id !== commentId));
            setCommentCount(commentCount - 1);
        } catch (error) {
            console.log("error occurred while attempting to delete comment: ", error);
        }
    }

    const handleNext = () => {
        const nextPage = currentPage + 1;
        const nextIndex = nextPage * COMMENT_PAGE_LENGTH;
    
        if (nextIndex < item.comments.length) { // Check if there are more comments to show
            setVisibleComments(item.comments.slice(nextIndex, nextIndex + COMMENT_PAGE_LENGTH));
            setCurrentPage(nextPage);
        }
    };
    
    const handlePrevious = () => {
        const prevPage = currentPage - 1;
        const prevIndex = prevPage * COMMENT_PAGE_LENGTH;
    
        if (prevIndex >= 0) { // Check if the index is valid
            setVisibleComments(item.comments.slice(prevIndex, prevIndex + COMMENT_PAGE_LENGTH));
            setCurrentPage(prevPage);
        }
    };


    const likeWorkout = async () => {
        try {
            const response = await axios.post(`${BACKEND_URL}/workout/${workoutId}/like`, {
                userId: parseInt(currentUserId),
            });
        } catch (error) {
            console.log("error occurred while attempting to like workout: ", error);
            setLiked(false)
            setLikeCount(likeCount - 1);
        }
    }

    const unlikeWorkout = async () => {
        try {
            const response = await axios.delete(`${BACKEND_URL}/workout/${workoutId}/like/${currentUserId}`);
        } catch (error) {
            console.log("error occurred while attempting to unlike workout: ", error);
            setLiked(true);
            setLikeCount(likeCount + 1);
        }
    }

    const handleLikePress = () => {
        if (liked) {
          setLiked(false);
          setLikeCount(likeCount - 1);
          unlikeWorkout();
        } else {
          setLiked(true);
          setLikeCount(likeCount + 1);
          likeWorkout();
        }
    }

    const renderComment = ({item}) => {
        return (
            <View style={styles.commentItemContainer}>
                <Text style={styles.commentText}>
                    <Text style={styles.commentUsername}>{item.user.username}<Text style={{fontWeight: 'normal'}}>: </Text></Text>
                    <Text style={styles.commentContent}>{item.content}</Text>
                </Text>
                
                {item.userId === parseInt(currentUserId) && (
                    <TouchableOpacity onPress={() => deleteComment(item.id)} style={styles.trashIcon}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="grey" />
                    </TouchableOpacity>
                )}
            </View>
        )
    }

    useEffect(() => {
        if (commentsOpen) {
            setOpenCommentBlock(parseInt(item.id));
        } else {
            setOpenCommentBlock(-1);
        }
    }, [commentsOpen]);

    return (
        <TouchableOpacity style={styles.workoutPlan} onPress={handleWorkoutPress} >
            <View style={styles.workoutMainContent}>
                {/* If we are rendering on a profile page, we don't need the username */}
                {!fromProfilePage && (
                    <Text>
                        <Text style={styles.username}>{item.username}</Text>
                        <Text style={styles.workoutDescription}>
                            {" "}
                            created a new workout plan
                        </Text>
                    </Text>
                )}
                <Text style={styles.workoutName}>{item.name}</Text>
            </View>

            <View style={styles.workoutBottomContent}>
                <View style={styles.postLikeAndCommentIconContainer}>
                    <TouchableOpacity style={styles.workoutLikesContainer} onPress={handleLikePress}>
                        {liked ? (
                            <MaterialCommunityIcons name="heart" size={24} color="#a99ee1" />
                        ) : (
                            <MaterialCommunityIcons name="heart-outline" size={24} color="grey" />
                        )}
                        <Text style={styles.workoutLikesCount}>{likeCount}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postCommentIconContainer} onPress={() => setCommentsOpen(!commentsOpen)} disabled={openCommentBlock !== -1 && openCommentBlock !== parseInt(item.id)}>
                        <MaterialCommunityIcons name="comment-outline" size={24} color={!commentsOpen ? ('grey') : ('#a99ee1')} />
                        <Text style={styles.workoutLikesCount}>{commentCount}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.workoutTime}>
                    {formatDistanceToNow(new Date(item.timeCreated), {
                    addSuffix: true,
                    })}
                </Text>
            </View>

            {commentsOpen && (
                <View style={styles.commentsContainer}>
                    <View style={styles.newCommentContainer}>
                        <TextInput
                            style={styles.commentInput}
                            onChangeText={setNewComment}
                            value={newComment}
                            placeholder="Write a comment..."
                            onSubmitEditing={postComment}
                        />
                        <TouchableOpacity onPress={postComment}>
                            <MaterialCommunityIcons name="send" size={24} color="#695acd" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={visibleComments} 
                        keyExtractor={(comment) => comment.id.toString()}
                        renderItem={renderComment}
                        style={styles.commentsList}
                    />
                    <View style={styles.paginationControls}>
                        {(currentPage !== 0) ? (
                            <TouchableOpacity onPress={handlePrevious} disabled={currentPage === 0}>
                                <MaterialCommunityIcons name="chevron-left" size={32} color="black" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity disabled={true}></TouchableOpacity>
                        )}
                        {((currentPage + 1) * COMMENT_PAGE_LENGTH < item.comments.length) ? (
                            <TouchableOpacity onPress={handleNext} disabled={(currentPage + 1) * COMMENT_PAGE_LENGTH >= item.comments.length}>
                                <MaterialCommunityIcons name="chevron-right" size={32} color="black" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity disabled={true}></TouchableOpacity>
                        )}
                        
                    </View>
                </View>
            )}
            
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    workoutPlan: {
        backgroundColor: "#FFF",
        paddingTop: 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: {
          width: 2,
          height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
        flexDirection: "column",
        justifyContent: "space-between",
      },
    workoutName: {
        fontWeight: "bold",
        marginTop: 8,
        fontSize: 23,
    },
    workoutMainContent: {},
    workoutDetail: {
        fontSize: 14,
    },
    workoutTime: {
        fontSize: 12,
        color: "#666",
        alignSelf: "flex-end",
    },
    username: {
        fontWeight: "bold",
    },
    workoutBottomContent: {
        marginTop: 5,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    workoutLikesContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    workoutLikesCount: {
        marginLeft: 5,
        fontSize: 16,
        color: "black",
    },
    commentsContainer: {
        marginTop: 10,
    },
    newCommentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
    },
    commentInput: {
        flex: 1,
        marginLeft: 10,
        marginRight: 10,
    },
    commentText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    commentsList: {
    },
    commentItemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    commentUsername: {
        fontWeight: "bold",           
    },
    commentContent: {
        flex: 1, // to take up rest of space                    
        fontSize: 14,                
        color: "#333",
    },
    paginationControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingHorizontal: 20,
    },
    trashIcon: {
        marginLeft: 10,
    },
    postLikeAndCommentIconContainer: {
        flexDirection: "row",
    },
    postCommentIconContainer: {
        flexDirection: "row",
        marginLeft: 10,
    },
});

export default WorkoutBlock;