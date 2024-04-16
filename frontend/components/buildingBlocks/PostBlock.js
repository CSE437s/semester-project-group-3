import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, TouchableOpacity, SafeAreaView, FlatList, TextInput} from "react-native";
import { Text, View, RefreshControl } from "@gluestack-ui/themed";

import axios from "axios";
import { BACKEND_URL } from "@env";
import { formatDistanceToNow, set } from "date-fns";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const COMMENT_PAGE_LENGTH = 4;

const PostBlock = ({ 
    navigation, 
    item, 
    currentUserId, 
    fromProfilePage, 
    canDelete, 
    onDeletePost, 
    openCommentBlock, 
    setOpenCommentBlock 
}) => {
    const [liked, setLiked] = useState(item.likes.some(like => parseInt(like.userId) === parseInt(currentUserId)));
    const [likeCount, setLikeCount] = useState(item.likes.length);

    const [commentsOpen, setCommentsOpen] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [commentCount, setCommentCount] = useState(item.comments?.length ?? 0);

    // pagination
    const [comments, setComments] = useState(item.comments ?? []);
    const [visibleComments, setVisibleComments] = useState(item.comments?.slice(0, COMMENT_PAGE_LENGTH) ?? []);
    const [currentPage, setCurrentPage] = useState(0);

    const postId = parseInt(item.id);

    // convert currentUserId to a string if we haven't yet
    if (typeof currentUserId === "string") {
        currentUserId = parseInt(currentUserId);
    }

    const postComment = async () => {
        if (newComment === "") {
            return;
        }
        try {
            const response = await axios.post(`${BACKEND_URL}/posts/${postId}/comment`, {
                userId: parseInt(currentUserId),
                text: newComment,
            });
            setNewComment("");
            setCommentCount(commentCount + 1);

            // add the comment to the visible comments and all comments
            const newlyCreatedComment = response.data;
            // console.log("bm - newlyCreatedComment: ", newlyCreatedComment)
            setVisibleComments([newlyCreatedComment, ...visibleComments.slice(0, COMMENT_PAGE_LENGTH - 1)]);
            setComments([...comments, newlyCreatedComment]);
        } catch (error) {
            console.log("error occurred while attempting to post comment: ", error);
        }
    }

    const deleteComment = async (commentId) => {
        try {
            const response = await axios.delete(`${BACKEND_URL}/posts/comment/${commentId}`);

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

    const likePost = async () => {
        try {
            const response = await axios.post(`${BACKEND_URL}/posts/${postId}/like`, {
                userId: parseInt(currentUserId),
            });
        } catch (error) {
            console.log("error occurred while attempting to like post: ", error);
            setLiked(false)
            setLikeCount(likeCount - 1);
        }
    }

    const unlikePost = async () => {
        try {
            const response = await axios.delete(`${BACKEND_URL}/posts/${postId}/like/${currentUserId}`);
        } catch (error) {
            console.log("error occurred while attempting to unlike post: ", error);
            setLiked(true);
            setLikeCount(likeCount + 1);
        }
    }

    const handleLikePress = () => {
        if (liked) {
          setLiked(false);
          setLikeCount(likeCount - 1);
          unlikePost();
        } else {
          setLiked(true);
          setLikeCount(likeCount + 1);
          likePost();
        }
    }

    const renderComment = ({item}) => {
        return (
            <View style={styles.commentItemContainer}>
                <Text style={styles.commentText}>
                    <Text style={styles.commentUsername}>{item.user.username}<Text style={{fontWeight: 'normal'}}>: </Text></Text>
                    <Text style={styles.commentContent}>{item.content}</Text>
                </Text>
                
                {item.userId === currentUserId && (
                    <TouchableOpacity onPress={() => deleteComment(item.id)} style={styles.trashIcon}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="grey" />
                    </TouchableOpacity>
                )}
            </View>
        )
    }

    useEffect(() => {
        // console.log("bm - in commentsOpen useEffect, commentsOpen: ", commentsOpen)
        if (commentsOpen) {
            setOpenCommentBlock(parseInt(item.id));
        } else {
            setOpenCommentBlock(-1);
        }
    }, [commentsOpen]);

    return (
        <TouchableOpacity style={styles.post} onPress={() => {}}>
            <View style={styles.postHeader}>
                {!fromProfilePage && <><Text style={styles.username}>{item.username}</Text><Text>: </Text></>}
                <View style={styles.captionAndIconContainer}>
                    <Text style={styles.postCaption}>{item.caption}</Text>
                    {canDelete && (
                        <TouchableOpacity style={styles.postDeleteIcon} onPress={() => onDeletePost(postId)}>
                            <MaterialCommunityIcons name="trash-can-outline" size={24} color="grey" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.postBottomContent}>
                <View style={styles.postLikeAndCommentIconContainer}>
                    <TouchableOpacity style={styles.postLikesContainer} onPress={handleLikePress}>
                        {liked ? (
                            <MaterialCommunityIcons name="heart" size={24} color="#a99ee1" />
                        ) : (
                            <MaterialCommunityIcons name="heart-outline" size={24} color="grey" />
                        )}
                        <Text style={styles.postLikesCount}>{likeCount}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postCommentIconContainer} onPress={() => setCommentsOpen(!commentsOpen)} disabled={openCommentBlock !== -1 && openCommentBlock !== parseInt(item.id)}>
                        <MaterialCommunityIcons name="comment-outline" size={24} color={!commentsOpen ? ('grey') : ('#a99ee1')} />
                        <Text style={styles.postLikesCount}>{commentCount}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.postTime}>
                    {formatDistanceToNow(new Date(item.timeCreated), { addSuffix: true })}
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
    )
}
const styles = StyleSheet.create({
    post: {
        backgroundColor: "#FFF",
        paddingTop: 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 3,
        flexDirection: "column",
    },
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 3,
    },
    captionAndIconContainer: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    username: {
        fontWeight: "bold",
        fontSize: 16,
    },
    postCaption: {
        flex: 1,
        fontSize: 16,
    },
    postDeleteIcon: {
    },
    postBottomContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    postLikesContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    postLikesCount: {
        marginLeft: 5,
    },
    postTime: {
        fontSize: 12,
        color: "#666",
    },
    postLikeAndCommentIconContainer: {
        flexDirection: "row",
    },
    postCommentIconContainer: {
        flexDirection: "row",
        marginLeft: 10,
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
    }
});

export default PostBlock;